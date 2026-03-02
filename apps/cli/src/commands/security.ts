import { Command } from 'commander';
import ora from 'ora';
import type { Address, Hex } from 'viem';
import type { AppContext } from '../context';
import type { AccountInfo, ChainConfig } from '../types';
import { SecurityHookService, createSignMessageForAuth, type EmailBindingResult } from '../services/securityHook';
import {
  SECURITY_HOOK_ADDRESS_MAP,
  CAPABILITY_LABELS,
  DEFAULT_CAPABILITY,
  DEFAULT_SAFETY_DELAY,
} from '../constants/securityHook';
import { encodeInstallHook, encodeUninstallHook, encodeForcePreUninstall } from '../utils/contracts/securityHook';
import { askConfirm, askInput } from '../utils/prompt';
import * as display from '../utils/display';
import { sanitizeErrorMessage } from '../utils/display';

// ─── Error Codes ──────────────────────────────────────────────────────

const ERR_ACCOUNT_NOT_READY = -32002;
const ERR_HOOK_AUTH_FAILED = -32007;
const _ERR_OTP_REQUIRED = -32008;
const _ERR_SPENDING_LIMIT = -32009;
const ERR_EMAIL_NOT_BOUND = -32010;
const ERR_SAFETY_DELAY = -32011;
const ERR_OTP_VERIFY_FAILED = -32012;
const ERR_INTERNAL = -32000;

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Resolve current account + chain, ensuring both exist and account is deployed.
 */
function resolveAccountAndChain(
  ctx: AppContext,
  opts: { requireDeployed?: boolean } = {}
): { account: AccountInfo; chainConfig: ChainConfig } {
  if (!ctx.deviceKey) {
    throw new SecurityError(ERR_ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
  }

  const current = ctx.account.currentAccount;
  if (!current) {
    throw new SecurityError(ERR_ACCOUNT_NOT_READY, 'No account selected. Run `elytro account create` first.');
  }

  const account = ctx.account.resolveAccount(current.alias ?? current.address);
  if (!account) {
    throw new SecurityError(ERR_ACCOUNT_NOT_READY, 'Account not found.');
  }

  if (opts.requireDeployed !== false && !account.isDeployed) {
    throw new SecurityError(ERR_ACCOUNT_NOT_READY, 'Account not deployed. Run `elytro account activate` first.');
  }

  const chainConfig = ctx.chain.chains.find((c) => c.id === account.chainId);
  if (!chainConfig) {
    throw new SecurityError(ERR_ACCOUNT_NOT_READY, `No chain config for chainId ${account.chainId}.`);
  }

  return { account, chainConfig };
}

/**
 * Create a SecurityHookService for the current context.
 */
function createHookService(ctx: AppContext, _chainConfig: ChainConfig): SecurityHookService {
  return new SecurityHookService({
    store: ctx.store,
    graphqlEndpoint: ctx.chain.graphqlEndpoint,
    signMessageForAuth: createSignMessageForAuth({
      signDigest: (digest) => ctx.keyring.signDigest(digest),
      packRawHash: (hash) => ctx.sdk.packRawHash(hash),
      packSignature: (rawSig, valData) => ctx.sdk.packUserOpSignature(rawSig, valData),
    }),
    readContract: async (params) => {
      return ctx.walletClient.readContract(params as Parameters<typeof ctx.walletClient.readContract>[0]);
    },
    getBlockTimestamp: async () => {
      const blockNumber = await ctx.walletClient.raw.getBlockNumber();
      const block = await ctx.walletClient.raw.getBlock({ blockNumber });
      return block.timestamp;
    },
  });
}

class SecurityError extends Error {
  code: number;
  data?: Record<string, unknown>;

  constructor(code: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.data = data;
  }
}

function handleSecurityError(err: unknown): void {
  if (err instanceof SecurityError) {
    display.txError({ code: err.code, message: sanitizeErrorMessage(err.message), data: err.data });
  } else {
    display.txError({
      code: ERR_INTERNAL,
      message: sanitizeErrorMessage((err as Error).message ?? String(err)),
    });
  }
  process.exitCode = 1;
}

// ─── Command Registration ─────────────────────────────────────────────

/**
 * `elytro security` — SecurityHook management.
 *
 * Subcommands:
 *   status                 — Show hook installation & security profile
 *   2fa install            — Install SecurityHook on current account
 *   2fa uninstall          — Normal uninstall (requires hook signature)
 *   2fa uninstall --force  — Start force-uninstall countdown
 *   2fa uninstall --force --execute — Execute force-uninstall after delay
 *   email bind <email>     — Bind email for OTP delivery
 *   email change <email>   — Change bound email
 *   spending-limit [amount] — View or set daily spending limit (USD)
 */
export function registerSecurityCommand(program: Command, ctx: AppContext): void {
  const security = program.command('security').description('SecurityHook (2FA & spending limits)');

  // ─── status ─────────────────────────────────────────────────

  security
    .command('status')
    .description('Show SecurityHook status and security profile')
    .action(async () => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        // Ensure services are initialized for this chain
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);
        const spinner = ora('Querying hook status...').start();

        // Query on-chain hook status
        const hookStatus = await hookService.getHookStatus(account.address, account.chainId);

        // Try to load security profile (may fail if not authenticated yet)
        let profile = null;
        try {
          profile = await hookService.loadSecurityProfile(account.address, account.chainId);
        } catch {
          // Silently ignore — profile may not exist yet
        }

        spinner.stop();

        display.heading('Security Status');
        display.info('Account', `${account.alias} (${display.address(account.address)})`);
        display.info('Chain', `${chainConfig.name} (${account.chainId})`);
        display.info('Hook Installed', hookStatus.installed ? 'Yes' : 'No');

        if (hookStatus.installed) {
          display.info('Hook Address', display.address(hookStatus.hookAddress));
          display.info(
            'Capabilities',
            [
              hookStatus.capabilities.preUserOpValidation && 'UserOp',
              hookStatus.capabilities.preIsValidSignature && 'Signature',
            ]
              .filter(Boolean)
              .join(' + ') || 'None'
          );

          if (hookStatus.forceUninstall.initiated) {
            display.info(
              'Force Uninstall',
              hookStatus.forceUninstall.canExecute
                ? 'Ready to execute'
                : `Pending until ${hookStatus.forceUninstall.availableAfter}`
            );
          }
        }

        if (profile) {
          console.log('');
          display.info('Email', profile.maskedEmail ?? profile.email ?? 'Not bound');
          display.info('Email Verified', profile.emailVerified ? 'Yes' : 'No');
          if (profile.dailyLimitUsdCents !== undefined) {
            display.info('Daily Limit', `$${(profile.dailyLimitUsdCents / 100).toFixed(2)}`);
          }
        } else if (hookStatus.installed) {
          console.log('');
          display.warn('Security profile not loaded (not yet authenticated or email not bound).');
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });

  // ─── 2fa ────────────────────────────────────────────────────

  const twofa = security.command('2fa').description('Install/uninstall SecurityHook (2FA)');

  // ─── 2fa install ──────────────────────────────────────────

  twofa
    .command('install')
    .description('Install SecurityHook on current account')
    .option(
      '--capability <flags>',
      'Capability flags: 1=SIGNATURE_ONLY, 2=USER_OP_ONLY, 3=BOTH',
      String(DEFAULT_CAPABILITY)
    )
    .action(async (opts) => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);

        // Check if already installed
        const spinner = ora('Checking hook status...').start();
        const currentStatus = await hookService.getHookStatus(account.address, account.chainId);
        spinner.stop();

        if (currentStatus.installed) {
          display.warn('SecurityHook is already installed on this account.');
          return;
        }

        const hookAddress = SECURITY_HOOK_ADDRESS_MAP[account.chainId];
        if (!hookAddress) {
          throw new SecurityError(ERR_INTERNAL, `SecurityHook not deployed on chain ${account.chainId}.`);
        }

        const capabilityFlags = Number(opts.capability) as 1 | 2 | 3;
        if (![1, 2, 3].includes(capabilityFlags)) {
          throw new SecurityError(ERR_INTERNAL, 'Invalid capability flags. Use 1, 2, or 3.');
        }

        display.heading('Install SecurityHook');
        display.info('Account', `${account.alias} (${display.address(account.address)})`);
        display.info('Hook Address', display.address(hookAddress));
        display.info('Capability', CAPABILITY_LABELS[capabilityFlags]);
        display.info('Safety Delay', `${DEFAULT_SAFETY_DELAY}s`);

        const confirmed = await askConfirm('Proceed with hook installation?');
        if (!confirmed) {
          display.warn('Cancelled.');
          return;
        }

        // Build install tx
        const installTx = encodeInstallHook(account.address, hookAddress, DEFAULT_SAFETY_DELAY, capabilityFlags);

        // Build UserOp from the install tx
        const buildSpinner = ora('Building UserOp...').start();
        try {
          const userOp = await ctx.sdk.createSendUserOp(account.address, [
            { to: installTx.to, value: installTx.value, data: installTx.data },
          ]);

          // Fee + Estimate + Sponsor + Sign + Send (reuse tx pipeline)
          const feeData = await ctx.sdk.getFeeData(chainConfig);
          userOp.maxFeePerGas = feeData.maxFeePerGas;
          userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

          buildSpinner.text = 'Estimating gas...';
          const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
          userOp.callGasLimit = gasEstimate.callGasLimit;
          userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
          userOp.preVerificationGas = gasEstimate.preVerificationGas;

          // Try sponsorship
          buildSpinner.text = 'Checking sponsorship...';
          try {
            const { requestSponsorship, applySponsorToUserOp } = await import('../utils/sponsor');
            const { sponsor: sponsorResult } = await requestSponsorship(
              ctx.chain.graphqlEndpoint,
              account.chainId,
              ctx.sdk.entryPoint,
              userOp
            );
            if (sponsorResult) applySponsorToUserOp(userOp, sponsorResult);
            buildSpinner.text = 'Sponsored. Signing...';
          } catch {
            buildSpinner.text = 'Sponsorship unavailable. Signing...';
          }

          // Sign
          const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
          const rawSignature = await ctx.keyring.signDigest(packedHash);
          userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

          // Send
          buildSpinner.text = 'Sending UserOp...';
          const opHash = await ctx.sdk.sendUserOp(userOp);

          buildSpinner.text = 'Waiting for receipt...';
          const receipt = await ctx.sdk.waitForReceipt(opHash);
          buildSpinner.stop();

          if (receipt.success) {
            display.success('SecurityHook installed successfully!');
            display.info('Tx Hash', receipt.transactionHash);
            if (chainConfig.blockExplorer) {
              display.info('Explorer', `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
            }
          } else {
            throw new SecurityError(ERR_INTERNAL, 'Hook installation UserOp reverted on-chain.', {
              txHash: receipt.transactionHash,
            });
          }
        } catch (innerErr) {
          buildSpinner.stop();
          throw innerErr;
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });

  // ─── 2fa uninstall ────────────────────────────────────────

  twofa
    .command('uninstall')
    .description('Uninstall SecurityHook from current account')
    .option('--force', 'Start force-uninstall countdown (bypass hook signature)')
    .option('--execute', 'Execute force-uninstall after safety delay has elapsed')
    .action(async (opts) => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);

        const spinner = ora('Checking hook status...').start();
        const currentStatus = await hookService.getHookStatus(account.address, account.chainId);
        spinner.stop();

        if (!currentStatus.installed) {
          display.warn('SecurityHook is not installed on this account.');
          return;
        }

        const hookAddress = currentStatus.hookAddress;

        if (opts.force && opts.execute) {
          // Step 2 of force uninstall: execute the final uninstallHook call
          if (!currentStatus.forceUninstall.initiated) {
            throw new SecurityError(
              ERR_SAFETY_DELAY,
              'Force-uninstall not initiated. Run `security 2fa uninstall --force` first.'
            );
          }
          if (!currentStatus.forceUninstall.canExecute) {
            throw new SecurityError(
              ERR_SAFETY_DELAY,
              `Safety delay not elapsed. Available after ${currentStatus.forceUninstall.availableAfter}.`
            );
          }

          display.heading('Execute Force Uninstall');
          display.info('Account', `${account.alias} (${display.address(account.address)})`);

          const confirmed = await askConfirm('Execute force uninstall? This will remove the SecurityHook.');
          if (!confirmed) {
            display.warn('Cancelled.');
            return;
          }

          // Build uninstallHook(address) tx — target is the wallet itself
          const uninstallTx = encodeUninstallHook(account.address, hookAddress);
          await sendSecurityTx(ctx, chainConfig, account, [uninstallTx], 'Executing force uninstall...');
        } else if (opts.force) {
          // Step 1 of force uninstall: call forcePreUninstall on the hook contract
          if (currentStatus.forceUninstall.initiated) {
            if (currentStatus.forceUninstall.canExecute) {
              display.info('Force Uninstall', 'Ready to execute. Run `security 2fa uninstall --force --execute`.');
            } else {
              display.info(
                'Force Uninstall',
                `Already initiated. Available after ${currentStatus.forceUninstall.availableAfter}.`
              );
            }
            return;
          }

          display.heading('Start Force Uninstall');
          display.info('Account', `${account.alias} (${display.address(account.address)})`);
          display.warn(`After starting, you must wait the safety delay (${DEFAULT_SAFETY_DELAY}s) before executing.`);

          const confirmed = await askConfirm('Start force-uninstall countdown?');
          if (!confirmed) {
            display.warn('Cancelled.');
            return;
          }

          // forcePreUninstall() — target is the SecurityHook contract, not the wallet
          const preUninstallTx = encodeForcePreUninstall(hookAddress);
          await sendSecurityTx(ctx, chainConfig, account, [preUninstallTx], 'Starting force-uninstall countdown...');
        } else {
          // Normal uninstall: requires hook signature (backend authorization)
          display.heading('Uninstall SecurityHook');
          display.info('Account', `${account.alias} (${display.address(account.address)})`);

          const confirmed = await askConfirm('Proceed with hook uninstall? (requires 2FA approval)');
          if (!confirmed) {
            display.warn('Cancelled.');
            return;
          }

          // Build uninstallHook tx
          const uninstallTx = encodeUninstallHook(account.address, hookAddress);

          // This goes through the hook-signed tx pipeline
          await sendSecurityTxWithHook(
            ctx,
            chainConfig,
            account,
            hookService,
            [uninstallTx],
            'Uninstalling SecurityHook...'
          );
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });

  // ─── email ──────────────────────────────────────────────────

  const email = security.command('email').description('Manage security email for OTP');

  // ─── email bind ───────────────────────────────────────────

  email
    .command('bind')
    .description('Bind an email address for OTP delivery')
    .argument('<email>', 'Email address to bind')
    .action(async (emailAddr: string) => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);

        const spinner = ora('Requesting email binding...').start();
        let bindingResult: EmailBindingResult;
        try {
          bindingResult = await hookService.requestEmailBinding(account.address, account.chainId, emailAddr);
        } catch (err) {
          spinner.stop();
          throw new SecurityError(ERR_HOOK_AUTH_FAILED, sanitizeErrorMessage((err as Error).message));
        }
        spinner.stop();

        display.info('OTP sent to', bindingResult.maskedEmail);
        display.info('Expires at', bindingResult.otpExpiresAt);

        // Prompt for OTP
        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const confirmSpinner = ora('Confirming email binding...').start();
        try {
          const profile = await hookService.confirmEmailBinding(
            account.address,
            account.chainId,
            bindingResult.bindingId,
            otpCode.trim()
          );
          confirmSpinner.stop();

          display.success('Email bound successfully!');
          display.info('Email', profile.maskedEmail ?? profile.email ?? emailAddr);
          display.info('Verified', profile.emailVerified ? 'Yes' : 'No');
        } catch (err) {
          confirmSpinner.stop();
          throw new SecurityError(
            ERR_OTP_VERIFY_FAILED,
            `OTP verification failed: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });

  // ─── email change ─────────────────────────────────────────

  email
    .command('change')
    .description('Change bound email address')
    .argument('<email>', 'New email address')
    .action(async (emailAddr: string) => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);

        const spinner = ora('Requesting email change...').start();
        let bindingResult: EmailBindingResult;
        try {
          bindingResult = await hookService.changeWalletEmail(account.address, account.chainId, emailAddr);
        } catch (err) {
          spinner.stop();
          throw new SecurityError(ERR_HOOK_AUTH_FAILED, sanitizeErrorMessage((err as Error).message));
        }
        spinner.stop();

        display.info('OTP sent to', bindingResult.maskedEmail);

        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const confirmSpinner = ora('Confirming email change...').start();
        try {
          const profile = await hookService.confirmEmailBinding(
            account.address,
            account.chainId,
            bindingResult.bindingId,
            otpCode.trim()
          );
          confirmSpinner.stop();

          display.success('Email changed successfully!');
          display.info('Email', profile.maskedEmail ?? profile.email ?? emailAddr);
        } catch (err) {
          confirmSpinner.stop();
          throw new SecurityError(
            ERR_OTP_VERIFY_FAILED,
            `OTP verification failed: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });

  // ─── spending-limit ─────────────────────────────────────────

  security
    .command('spending-limit')
    .description('View or set daily spending limit (USD)')
    .argument('[amount]', 'Daily limit in USD (e.g. "100" for $100). Omit to view current limit.')
    .action(async (amountStr?: string) => {
      try {
        const { account, chainConfig } = resolveAccountAndChain(ctx);

        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const hookService = createHookService(ctx, chainConfig);

        if (!amountStr) {
          // View current limit
          const spinner = ora('Loading security profile...').start();
          let profile;
          try {
            profile = await hookService.loadSecurityProfile(account.address, account.chainId);
          } catch (err) {
            spinner.stop();
            throw err;
          }
          spinner.stop();

          if (!profile) {
            display.warn('No security profile found. Bind an email first: `elytro security email bind <email>`.');
            return;
          }

          display.heading('Spending Limit');
          display.info(
            'Daily Limit',
            profile.dailyLimitUsdCents !== undefined ? `$${(profile.dailyLimitUsdCents / 100).toFixed(2)}` : 'Not set'
          );
          display.info('Email', profile.maskedEmail ?? 'Not bound');
          return;
        }

        // Set new limit
        const amountUsd = parseFloat(amountStr);
        if (isNaN(amountUsd) || amountUsd < 0) {
          throw new SecurityError(ERR_INTERNAL, 'Invalid amount. Provide a positive number in USD.');
        }
        const dailyLimitUsdCents = Math.round(amountUsd * 100);

        display.heading('Set Daily Spending Limit');
        display.info('New Limit', `$${amountUsd.toFixed(2)}`);

        // First, request OTP
        const spinner = ora('Requesting OTP for limit change...').start();
        let otpResult: { maskedEmail: string; otpExpiresAt: string };
        try {
          otpResult = await hookService.requestDailyLimitOtp(account.address, account.chainId, dailyLimitUsdCents);
        } catch (err) {
          spinner.stop();
          // If email not bound, provide helpful message
          const msg = (err as Error).message ?? '';
          if (msg.includes('EMAIL') || msg.includes('email') || msg.includes('NOT_FOUND')) {
            throw new SecurityError(
              ERR_EMAIL_NOT_BOUND,
              'Email not bound. Run `elytro security email bind <email>` first.'
            );
          }
          throw new SecurityError(ERR_HOOK_AUTH_FAILED, sanitizeErrorMessage(msg));
        }
        spinner.stop();

        display.info('OTP sent to', otpResult.maskedEmail);

        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const setSpinner = ora('Setting daily limit...').start();
        try {
          await hookService.setDailyLimit(account.address, account.chainId, dailyLimitUsdCents, otpCode.trim());
          setSpinner.stop();
          display.success(`Daily limit set to $${amountUsd.toFixed(2)}.`);
        } catch (err) {
          setSpinner.stop();
          throw new SecurityError(
            ERR_OTP_VERIFY_FAILED,
            `Failed to set limit: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } catch (err) {
        handleSecurityError(err);
      }
    });
}

// ─── Shared Tx Pipelines ──────────────────────────────────────────────

/**
 * Build, sign, and send a UserOp for a security operation (no hook signature required).
 * Used for: force-pre-uninstall, force-execute-uninstall.
 */
async function sendSecurityTx(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  txs: Array<{ to: Address; value: string; data: Hex }>,
  spinnerText: string
): Promise<void> {
  const spinner = ora(spinnerText).start();

  try {
    const userOp = await ctx.sdk.createSendUserOp(
      account.address,
      txs.map((tx) => ({ to: tx.to, value: tx.value, data: tx.data }))
    );

    // Fee + Estimate
    const feeData = await ctx.sdk.getFeeData(chainConfig);
    userOp.maxFeePerGas = feeData.maxFeePerGas;
    userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

    spinner.text = 'Estimating gas...';
    const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
    userOp.callGasLimit = gasEstimate.callGasLimit;
    userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOp.preVerificationGas = gasEstimate.preVerificationGas;

    // Sponsor
    spinner.text = 'Checking sponsorship...';
    try {
      const { requestSponsorship, applySponsorToUserOp } = await import('../utils/sponsor');
      const { sponsor: sponsorResult } = await requestSponsorship(
        ctx.chain.graphqlEndpoint,
        account.chainId,
        ctx.sdk.entryPoint,
        userOp
      );
      if (sponsorResult) applySponsorToUserOp(userOp, sponsorResult);
    } catch {
      // Self-pay fallback
    }

    // Sign (no hook)
    spinner.text = 'Signing...';
    const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
    const rawSignature = await ctx.keyring.signDigest(packedHash);
    userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

    // Send
    spinner.text = 'Sending UserOp...';
    const opHash = await ctx.sdk.sendUserOp(userOp);

    spinner.text = 'Waiting for receipt...';
    const receipt = await ctx.sdk.waitForReceipt(opHash);
    spinner.stop();

    if (receipt.success) {
      display.success('Transaction confirmed!');
      display.info('Tx Hash', receipt.transactionHash);
      if (chainConfig.blockExplorer) {
        display.info('Explorer', `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
      }
    } else {
      throw new SecurityError(ERR_INTERNAL, 'Transaction reverted on-chain.', {
        txHash: receipt.transactionHash,
      });
    }
  } catch (err) {
    spinner.stop();
    throw err;
  }
}

/**
 * Build, sign, and send a UserOp that requires hook signature (backend 2FA).
 * Used for: normal uninstall.
 *
 * Flow:
 * 1. Build UserOp + estimate + sponsor
 * 2. Pre-sign (get opHash + raw signature)
 * 3. Get hook signature from backend (authorizeUserOperation)
 * 4. If OTP required: prompt user → verify → retry authorization
 * 5. Pack final signature with hook data
 * 6. Send
 */
async function sendSecurityTxWithHook(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  hookService: SecurityHookService,
  txs: Array<{ to: Address; value: string; data: Hex }>,
  spinnerText: string
): Promise<void> {
  const spinner = ora(spinnerText).start();

  try {
    const userOp = await ctx.sdk.createSendUserOp(
      account.address,
      txs.map((tx) => ({ to: tx.to, value: tx.value, data: tx.data }))
    );

    // Fee + Estimate
    const feeData = await ctx.sdk.getFeeData(chainConfig);
    userOp.maxFeePerGas = feeData.maxFeePerGas;
    userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

    spinner.text = 'Estimating gas...';
    const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
    userOp.callGasLimit = gasEstimate.callGasLimit;
    userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOp.preVerificationGas = gasEstimate.preVerificationGas;

    // Sponsor
    spinner.text = 'Checking sponsorship...';
    try {
      const { requestSponsorship, applySponsorToUserOp } = await import('../utils/sponsor');
      const { sponsor: sponsorResult } = await requestSponsorship(
        ctx.chain.graphqlEndpoint,
        account.chainId,
        ctx.sdk.entryPoint,
        userOp
      );
      if (sponsorResult) applySponsorToUserOp(userOp, sponsorResult);
    } catch {
      // Self-pay fallback
    }

    // Pre-sign: get hash + raw signature (without hook)
    spinner.text = 'Signing...';
    const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
    const rawSignature = await ctx.keyring.signDigest(packedHash);

    // Temporarily pack without hook to set signature for authorization request
    userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

    // Get hook signature from backend
    spinner.text = 'Requesting hook authorization...';
    let hookResult = await hookService.getHookSignature(account.address, account.chainId, ctx.sdk.entryPoint, userOp);

    // Handle OTP challenge
    if (hookResult.error) {
      spinner.stop();
      const errCode = hookResult.error.code;

      if (errCode === 'OTP_REQUIRED' || errCode === 'SPENDING_LIMIT_EXCEEDED') {
        display.warn(hookResult.error.message ?? `Verification required (${errCode}).`);
        if (hookResult.error.maskedEmail) {
          display.info('OTP sent to', hookResult.error.maskedEmail);
        }
        if (errCode === 'SPENDING_LIMIT_EXCEEDED' && hookResult.error.projectedSpendUsdCents !== undefined) {
          display.info('Projected spend', `$${(hookResult.error.projectedSpendUsdCents / 100).toFixed(2)}`);
          display.info('Daily limit', `$${((hookResult.error.dailyLimitUsdCents ?? 0) / 100).toFixed(2)}`);
        }

        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const verifySpinner = ora('Verifying OTP...').start();
        try {
          await hookService.verifySecurityOtp(
            account.address,
            account.chainId,
            hookResult.error.challengeId!,
            otpCode.trim()
          );
          verifySpinner.text = 'OTP verified. Retrying authorization...';

          // Retry authorization after OTP verification
          hookResult = await hookService.getHookSignature(account.address, account.chainId, ctx.sdk.entryPoint, userOp);
          verifySpinner.stop();

          if (hookResult.error) {
            throw new SecurityError(
              ERR_HOOK_AUTH_FAILED,
              `Authorization failed after OTP: ${hookResult.error.message}`
            );
          }
        } catch (err) {
          verifySpinner.stop();
          if (err instanceof SecurityError) throw err;
          throw new SecurityError(
            ERR_OTP_VERIFY_FAILED,
            `OTP verification failed: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } else {
        throw new SecurityError(
          ERR_HOOK_AUTH_FAILED,
          `Hook authorization failed: ${hookResult.error.message ?? errCode}`
        );
      }
    }

    // Pack final signature with hook data
    if (!spinner.isSpinning) spinner.start('Packing signature...');
    const hookAddress = SECURITY_HOOK_ADDRESS_MAP[account.chainId];
    userOp.signature = await ctx.sdk.packUserOpSignatureWithHook(
      rawSignature,
      validationData,
      hookAddress,
      hookResult.signature! as Hex
    );

    // Send
    spinner.text = 'Sending UserOp...';
    const opHash = await ctx.sdk.sendUserOp(userOp);

    spinner.text = 'Waiting for receipt...';
    const receipt = await ctx.sdk.waitForReceipt(opHash);
    spinner.stop();

    if (receipt.success) {
      display.success('Transaction confirmed!');
      display.info('Tx Hash', receipt.transactionHash);
      if (chainConfig.blockExplorer) {
        display.info('Explorer', `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
      }
    } else {
      throw new SecurityError(ERR_INTERNAL, 'Transaction reverted on-chain.', {
        txHash: receipt.transactionHash,
      });
    }
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
