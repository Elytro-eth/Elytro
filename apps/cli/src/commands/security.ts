import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import type { Address, Hex } from 'viem';
import type { AppContext } from '../context';
import type { AccountInfo, ChainConfig, ElytroUserOperation } from '../types';
import {
  SecurityHookService,
  createSignMessageForAuth,
  type HookSignatureResult,
  type EmailBindingResult,
} from '../services/securityHook';
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
import { outputSuccess, handleError, CliError, ErrorCode, isJsonMode } from '../utils/output';

// ─── Context Setup ────────────────────────────────────────────────────

interface SecurityContext {
  account: AccountInfo;
  chainConfig: ChainConfig;
  hookService: SecurityHookService;
}

/**
 * Resolve account, initialize chain services, and create hook service.
 * Every security subcommand starts with this.
 */
function initSecurityContext(ctx: AppContext): SecurityContext {
  if (!ctx.keyring.isUnlocked) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
  }

  const current = ctx.account.currentAccount;
  if (!current) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'No account selected. Run `elytro account create` first.');
  }

  const account = ctx.account.resolveAccount(current.alias ?? current.address);
  if (!account) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'Account not found.');
  }

  if (!account.isDeployed) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'Account not deployed. Run `elytro account activate` first.');
  }

  const chainConfig = ctx.chain.chains.find((c) => c.id === account.chainId);
  if (!chainConfig) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `No chain config for chainId ${account.chainId}.`);
  }

  ctx.walletClient.initForChain(chainConfig);

  const hookService = new SecurityHookService({
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

  return { account, chainConfig, hookService };
}

// ─── Shared UserOp Pipeline ──────────────────────────────────────────

/**
 * Build a UserOp from transactions: create → fee → estimate → sponsor.
 * Returns an unsigned UserOp ready for signing.
 */
async function buildSecurityUserOp(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  txs: Array<{ to: Address; value: string; data: Hex }>,
  spinner: Ora | null
): Promise<ElytroUserOperation> {
  const userOp = await ctx.sdk.createSendUserOp(
    account.address,
    txs.map((tx) => ({ to: tx.to, value: tx.value, data: tx.data }))
  );

  const feeData = await ctx.sdk.getFeeData(chainConfig);
  userOp.maxFeePerGas = feeData.maxFeePerGas;
  userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

  if (spinner) spinner.text = 'Estimating gas...';
  const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
  userOp.callGasLimit = gasEstimate.callGasLimit;
  userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
  userOp.preVerificationGas = gasEstimate.preVerificationGas;

  if (spinner) spinner.text = 'Checking sponsorship...';
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

  return userOp;
}

/**
 * Sign a UserOp (plain, no hook), send, and wait for receipt.
 * Returns structured result for JSON output.
 */
async function signAndSend(
  ctx: AppContext,
  chainConfig: ChainConfig,
  userOp: ElytroUserOperation,
  spinner: Ora | null
): Promise<{ txHash: string; success: boolean; explorerUrl?: string }> {
  if (spinner) spinner.text = 'Signing...';
  const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
  const rawSignature = await ctx.keyring.signDigest(packedHash);
  userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

  if (spinner) spinner.text = 'Sending UserOp...';
  const opHash = await ctx.sdk.sendUserOp(userOp);

  if (spinner) spinner.text = 'Waiting for receipt...';
  const receipt = await ctx.sdk.waitForReceipt(opHash);
  if (spinner) spinner.stop();

  if (!receipt.success) {
    throw new CliError(ErrorCode.INTERNAL, 'Transaction reverted on-chain.', {
      txHash: receipt.transactionHash,
    });
  }

  if (!isJsonMode()) {
    display.success('Transaction confirmed!');
  }

  return {
    txHash: receipt.transactionHash,
    success: receipt.success,
    ...(chainConfig.blockExplorer ? { explorerUrl: `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}` } : {}),
  };
}

/**
 * Sign a UserOp with hook authorization (2FA), send, and wait for receipt.
 */
async function signWithHookAndSend(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  hookService: SecurityHookService,
  userOp: ElytroUserOperation,
  spinner: Ora | null
): Promise<{ txHash: string; success: boolean; explorerUrl?: string }> {
  if (spinner) spinner.text = 'Signing...';
  const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
  const rawSignature = await ctx.keyring.signDigest(packedHash);

  // Temporarily pack without hook for authorization request
  userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

  // Request hook authorization
  if (spinner) spinner.text = 'Requesting hook authorization...';
  let hookResult = await hookService.getHookSignature(account.address, account.chainId, ctx.sdk.entryPoint, userOp);

  // Handle OTP challenge
  if (hookResult.error) {
    if (spinner) spinner.stop();
    hookResult = await handleOtpChallenge(hookService, account, ctx, userOp, hookResult);
  }

  // Pack final signature with hook data
  if (spinner && !spinner.isSpinning) spinner.start('Packing signature...');
  const hookAddress = SECURITY_HOOK_ADDRESS_MAP[account.chainId];
  userOp.signature = await ctx.sdk.packUserOpSignatureWithHook(
    rawSignature,
    validationData,
    hookAddress,
    hookResult.signature! as Hex
  );

  // Send
  if (spinner) spinner.text = 'Sending UserOp...';
  const opHash = await ctx.sdk.sendUserOp(userOp);

  if (spinner) spinner.text = 'Waiting for receipt...';
  const receipt = await ctx.sdk.waitForReceipt(opHash);
  if (spinner) spinner.stop();

  if (!receipt.success) {
    throw new CliError(ErrorCode.INTERNAL, 'Transaction reverted on-chain.', {
      txHash: receipt.transactionHash,
    });
  }

  if (!isJsonMode()) {
    display.success('Transaction confirmed!');
  }

  return {
    txHash: receipt.transactionHash,
    success: receipt.success,
    ...(chainConfig.blockExplorer ? { explorerUrl: `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}` } : {}),
  };
}

/**
 * Handle OTP challenge from hook authorization.
 */
async function handleOtpChallenge(
  hookService: SecurityHookService,
  account: AccountInfo,
  ctx: AppContext,
  userOp: ElytroUserOperation,
  hookResult: HookSignatureResult
): Promise<HookSignatureResult> {
  const err = hookResult.error!;
  const errCode = err.code ?? 'UNKNOWN';

  if (errCode !== 'OTP_REQUIRED' && errCode !== 'SPENDING_LIMIT_EXCEEDED') {
    throw new CliError(ErrorCode.HOOK_AUTH_FAILED, `Hook authorization failed: ${err.message ?? errCode}`);
  }

  if (!isJsonMode()) {
    display.warn(err.message ?? `Verification required (${errCode}).`);
    if (err.maskedEmail) {
      display.info('OTP sent to', err.maskedEmail);
    }
    if (errCode === 'SPENDING_LIMIT_EXCEEDED' && err.projectedSpendUsdCents !== undefined) {
      display.info('Projected spend', `$${(err.projectedSpendUsdCents / 100).toFixed(2)}`);
      display.info('Daily limit', `$${((err.dailyLimitUsdCents ?? 0) / 100).toFixed(2)}`);
    }
  }

  const otpCode = await askInput('Enter the 6-digit OTP code:');

  const verifySpinner = isJsonMode() ? null : ora('Verifying OTP...').start();
  try {
    await hookService.verifySecurityOtp(account.address, account.chainId, err.challengeId!, otpCode.trim());
    if (verifySpinner) verifySpinner.text = 'OTP verified. Retrying authorization...';

    const retryResult = await hookService.getHookSignature(
      account.address,
      account.chainId,
      ctx.sdk.entryPoint,
      userOp
    );
    if (verifySpinner) verifySpinner.stop();

    if (retryResult.error) {
      throw new CliError(ErrorCode.HOOK_AUTH_FAILED, `Authorization failed after OTP: ${retryResult.error.message}`);
    }

    return retryResult;
  } catch (e) {
    if (verifySpinner) verifySpinner.stop();
    if (e instanceof CliError) throw e;
    throw new CliError(
      ErrorCode.OTP_VERIFY_FAILED,
      `OTP verification failed: ${sanitizeErrorMessage((e as Error).message)}`
    );
  }
}

// ─── Command Registration ─────────────────────────────────────────────

export function registerSecurityCommand(program: Command, ctx: AppContext): void {
  const security = program.command('security').description('SecurityHook (2FA & spending limits)');

  // ─── status ─────────────────────────────────────────────────

  security
    .command('status')
    .description('Show SecurityHook status and security profile')
    .action(async () => {
      try {
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        const spinner = isJsonMode() ? null : ora('Querying hook status...').start();
        const hookStatus = await hookService.getHookStatus(account.address, account.chainId);

        let profile = null;
        try {
          profile = await hookService.loadSecurityProfile(account.address, account.chainId);
        } catch {
          // Silently ignore — profile may not exist yet
        }
        if (spinner) spinner.stop();

        const result: Record<string, unknown> = {
          account: account.alias,
          address: account.address,
          chainId: account.chainId,
          chainName: chainConfig.name,
          hookInstalled: hookStatus.installed,
        };

        if (hookStatus.installed) {
          result.hookAddress = hookStatus.hookAddress;
          result.capabilities = {
            preUserOpValidation: hookStatus.capabilities.preUserOpValidation,
            preIsValidSignature: hookStatus.capabilities.preIsValidSignature,
          };
          result.forceUninstall = {
            initiated: hookStatus.forceUninstall.initiated,
            canExecute: hookStatus.forceUninstall.canExecute,
            availableAfter: hookStatus.forceUninstall.availableAfter,
          };
        }

        if (profile) {
          result.email = profile.maskedEmail ?? profile.email ?? null;
          result.emailVerified = profile.emailVerified ?? false;
          result.dailyLimitUsd = profile.dailyLimitUsdCents !== undefined ? profile.dailyLimitUsdCents / 100 : null;
        }

        outputSuccess(result);
      } catch (err) {
        handleError(err);
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
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        const spinner = isJsonMode() ? null : ora('Checking hook status...').start();
        const currentStatus = await hookService.getHookStatus(account.address, account.chainId);
        if (spinner) spinner.stop();

        if (currentStatus.installed) {
          outputSuccess({
            status: 'already_installed',
            account: account.alias,
            address: account.address,
            hookAddress: currentStatus.hookAddress,
          });
          return;
        }

        const hookAddress = SECURITY_HOOK_ADDRESS_MAP[account.chainId];
        if (!hookAddress) {
          throw new CliError(ErrorCode.INTERNAL, `SecurityHook not deployed on chain ${account.chainId}.`);
        }

        const capabilityFlags = Number(opts.capability) as 1 | 2 | 3;
        if (![1, 2, 3].includes(capabilityFlags)) {
          throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid capability flags. Use 1, 2, or 3.');
        }

        if (!isJsonMode()) {
          display.heading('Install SecurityHook');
          display.info('Account', `${account.alias} (${display.address(account.address)})`);
          display.info('Hook Address', display.address(hookAddress));
          display.info('Capability', CAPABILITY_LABELS[capabilityFlags]);
          display.info('Safety Delay', `${DEFAULT_SAFETY_DELAY}s`);

          const confirmed = await askConfirm('Proceed with hook installation?');
          if (!confirmed) {
            outputSuccess({ status: 'cancelled' });
            return;
          }
        }

        const installTx = encodeInstallHook(account.address, hookAddress, DEFAULT_SAFETY_DELAY, capabilityFlags);
        const buildSpinner = isJsonMode() ? null : ora('Building UserOp...').start();
        try {
          const userOp = await buildSecurityUserOp(ctx, chainConfig, account, [installTx], buildSpinner);
          const txResult = await signAndSend(ctx, chainConfig, userOp, buildSpinner);

          outputSuccess({
            status: 'installed',
            account: account.alias,
            address: account.address,
            hookAddress,
            capability: CAPABILITY_LABELS[capabilityFlags],
            safetyDelay: DEFAULT_SAFETY_DELAY,
            ...txResult,
          });
        } catch (innerErr) {
          if (buildSpinner) buildSpinner.stop();
          throw innerErr;
        }
      } catch (err) {
        handleError(err);
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
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        const spinner = isJsonMode() ? null : ora('Checking hook status...').start();
        const currentStatus = await hookService.getHookStatus(account.address, account.chainId);
        if (spinner) spinner.stop();

        if (!currentStatus.installed) {
          outputSuccess({
            status: 'not_installed',
            account: account.alias,
            address: account.address,
          });
          return;
        }

        const hookAddress = currentStatus.hookAddress;

        if (opts.force && opts.execute) {
          await handleForceExecute(ctx, chainConfig, account, currentStatus);
        } else if (opts.force) {
          await handleForceStart(ctx, chainConfig, account, currentStatus, hookAddress);
        } else {
          await handleNormalUninstall(ctx, chainConfig, account, hookService, hookAddress);
        }
      } catch (err) {
        handleError(err);
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
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        const spinner = isJsonMode() ? null : ora('Requesting email binding...').start();
        let bindingResult: EmailBindingResult;
        try {
          bindingResult = await hookService.requestEmailBinding(account.address, account.chainId, emailAddr);
        } catch (err) {
          if (spinner) spinner.stop();
          throw new CliError(ErrorCode.HOOK_AUTH_FAILED, sanitizeErrorMessage((err as Error).message));
        }
        if (spinner) spinner.stop();

        if (!isJsonMode()) {
          display.info('OTP sent to', bindingResult.maskedEmail);
          display.info('Expires at', bindingResult.otpExpiresAt);
        }

        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const confirmSpinner = isJsonMode() ? null : ora('Confirming email binding...').start();
        try {
          const profile = await hookService.confirmEmailBinding(
            account.address,
            account.chainId,
            bindingResult.bindingId,
            otpCode.trim()
          );
          if (confirmSpinner) confirmSpinner.stop();

          outputSuccess({
            status: 'bound',
            account: account.alias,
            address: account.address,
            email: profile.maskedEmail ?? profile.email ?? emailAddr,
            emailVerified: profile.emailVerified ?? false,
          });
        } catch (err) {
          if (confirmSpinner) confirmSpinner.stop();
          throw new CliError(
            ErrorCode.OTP_VERIFY_FAILED,
            `OTP verification failed: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // ─── email change ─────────────────────────────────────────

  email
    .command('change')
    .description('Change bound email address')
    .argument('<email>', 'New email address')
    .action(async (emailAddr: string) => {
      try {
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        const spinner = isJsonMode() ? null : ora('Requesting email change...').start();
        let bindingResult: EmailBindingResult;
        try {
          bindingResult = await hookService.changeWalletEmail(account.address, account.chainId, emailAddr);
        } catch (err) {
          if (spinner) spinner.stop();
          throw new CliError(ErrorCode.HOOK_AUTH_FAILED, sanitizeErrorMessage((err as Error).message));
        }
        if (spinner) spinner.stop();

        if (!isJsonMode()) {
          display.info('OTP sent to', bindingResult.maskedEmail);
        }

        const otpCode = await askInput('Enter the 6-digit OTP code:');

        const confirmSpinner = isJsonMode() ? null : ora('Confirming email change...').start();
        try {
          const profile = await hookService.confirmEmailBinding(
            account.address,
            account.chainId,
            bindingResult.bindingId,
            otpCode.trim()
          );
          if (confirmSpinner) confirmSpinner.stop();

          outputSuccess({
            status: 'changed',
            account: account.alias,
            address: account.address,
            email: profile.maskedEmail ?? profile.email ?? emailAddr,
          });
        } catch (err) {
          if (confirmSpinner) confirmSpinner.stop();
          throw new CliError(
            ErrorCode.OTP_VERIFY_FAILED,
            `OTP verification failed: ${sanitizeErrorMessage((err as Error).message)}`
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // ─── spending-limit ─────────────────────────────────────────

  security
    .command('spending-limit')
    .description('View or set daily spending limit (USD)')
    .argument('[amount]', 'Daily limit in USD (e.g. "100" for $100). Omit to view current limit.')
    .action(async (amountStr?: string) => {
      try {
        const { account, chainConfig, hookService } = initSecurityContext(ctx);
        await ctx.sdk.initForChain(chainConfig);

        if (!amountStr) {
          await showSpendingLimit(hookService, account);
        } else {
          await setSpendingLimit(hookService, account, amountStr);
        }
      } catch (err) {
        handleError(err);
      }
    });
}

// ─── Uninstall Subflows ───────────────────────────────────────────────

async function handleForceExecute(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  currentStatus: Awaited<ReturnType<SecurityHookService['getHookStatus']>>
): Promise<void> {
  if (!currentStatus.forceUninstall.initiated) {
    throw new CliError(
      ErrorCode.SAFETY_DELAY,
      'Force-uninstall not initiated. Run `security 2fa uninstall --force` first.'
    );
  }
  if (!currentStatus.forceUninstall.canExecute) {
    throw new CliError(
      ErrorCode.SAFETY_DELAY,
      `Safety delay not elapsed. Available after ${currentStatus.forceUninstall.availableAfter}.`
    );
  }

  if (!isJsonMode()) {
    display.heading('Execute Force Uninstall');
    display.info('Account', `${account.alias} (${display.address(account.address)})`);

    const confirmed = await askConfirm('Execute force uninstall? This will remove the SecurityHook.');
    if (!confirmed) {
      outputSuccess({ status: 'cancelled' });
      return;
    }
  }

  const uninstallTx = encodeUninstallHook(account.address, currentStatus.hookAddress);
  const spinner = isJsonMode() ? null : ora('Executing force uninstall...').start();
  try {
    const userOp = await buildSecurityUserOp(ctx, chainConfig, account, [uninstallTx], spinner);
    const txResult = await signAndSend(ctx, chainConfig, userOp, spinner);
    outputSuccess({
      status: 'force_uninstalled',
      account: account.alias,
      address: account.address,
      ...txResult,
    });
  } catch (err) {
    if (spinner) spinner.stop();
    throw err;
  }
}

async function handleForceStart(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  currentStatus: Awaited<ReturnType<SecurityHookService['getHookStatus']>>,
  hookAddress: Address
): Promise<void> {
  if (currentStatus.forceUninstall.initiated) {
    outputSuccess({
      status: currentStatus.forceUninstall.canExecute ? 'ready_to_execute' : 'pending',
      account: account.alias,
      address: account.address,
      availableAfter: currentStatus.forceUninstall.availableAfter,
      hint: currentStatus.forceUninstall.canExecute
        ? 'Run `security 2fa uninstall --force --execute`.'
        : `Wait until ${currentStatus.forceUninstall.availableAfter}.`,
    });
    return;
  }

  if (!isJsonMode()) {
    display.heading('Start Force Uninstall');
    display.info('Account', `${account.alias} (${display.address(account.address)})`);
    display.warn(`After starting, you must wait the safety delay (${DEFAULT_SAFETY_DELAY}s) before executing.`);

    const confirmed = await askConfirm('Start force-uninstall countdown?');
    if (!confirmed) {
      outputSuccess({ status: 'cancelled' });
      return;
    }
  }

  const preUninstallTx = encodeForcePreUninstall(hookAddress);
  const spinner = isJsonMode() ? null : ora('Starting force-uninstall countdown...').start();
  try {
    const userOp = await buildSecurityUserOp(ctx, chainConfig, account, [preUninstallTx], spinner);
    const txResult = await signAndSend(ctx, chainConfig, userOp, spinner);
    outputSuccess({
      status: 'force_uninstall_started',
      account: account.alias,
      address: account.address,
      safetyDelay: DEFAULT_SAFETY_DELAY,
      ...txResult,
    });
  } catch (err) {
    if (spinner) spinner.stop();
    throw err;
  }
}

async function handleNormalUninstall(
  ctx: AppContext,
  chainConfig: ChainConfig,
  account: AccountInfo,
  hookService: SecurityHookService,
  hookAddress: Address
): Promise<void> {
  if (!isJsonMode()) {
    display.heading('Uninstall SecurityHook');
    display.info('Account', `${account.alias} (${display.address(account.address)})`);

    const confirmed = await askConfirm('Proceed with hook uninstall? (requires 2FA approval)');
    if (!confirmed) {
      outputSuccess({ status: 'cancelled' });
      return;
    }
  }

  const uninstallTx = encodeUninstallHook(account.address, hookAddress);
  const spinner = isJsonMode() ? null : ora('Building UserOp...').start();
  try {
    const userOp = await buildSecurityUserOp(ctx, chainConfig, account, [uninstallTx], spinner);
    const txResult = await signWithHookAndSend(ctx, chainConfig, account, hookService, userOp, spinner);
    outputSuccess({
      status: 'uninstalled',
      account: account.alias,
      address: account.address,
      ...txResult,
    });
  } catch (err) {
    if (spinner) spinner.stop();
    throw err;
  }
}

// ─── Spending Limit Subflows ──────────────────────────────────────────

async function showSpendingLimit(hookService: SecurityHookService, account: AccountInfo): Promise<void> {
  const spinner = isJsonMode() ? null : ora('Loading security profile...').start();
  let profile;
  try {
    profile = await hookService.loadSecurityProfile(account.address, account.chainId);
  } catch (err) {
    if (spinner) spinner.stop();
    throw err;
  }
  if (spinner) spinner.stop();

  if (!profile) {
    outputSuccess({
      account: account.alias,
      address: account.address,
      dailyLimitUsd: null,
      email: null,
      hint: 'Bind an email first: `elytro security email bind <email>`.',
    });
    return;
  }

  outputSuccess({
    account: account.alias,
    address: account.address,
    dailyLimitUsd: profile.dailyLimitUsdCents !== undefined ? profile.dailyLimitUsdCents / 100 : null,
    email: profile.maskedEmail ?? null,
  });
}

async function setSpendingLimit(
  hookService: SecurityHookService,
  account: AccountInfo,
  amountStr: string
): Promise<void> {
  const amountUsd = parseFloat(amountStr);
  if (isNaN(amountUsd) || amountUsd < 0) {
    throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid amount. Provide a positive number in USD.');
  }
  const dailyLimitUsdCents = Math.round(amountUsd * 100);

  if (!isJsonMode()) {
    display.heading('Set Daily Spending Limit');
    display.info('New Limit', `$${amountUsd.toFixed(2)}`);
  }

  const spinner = isJsonMode() ? null : ora('Requesting OTP for limit change...').start();
  let otpResult: { maskedEmail: string; otpExpiresAt: string };
  try {
    otpResult = await hookService.requestDailyLimitOtp(account.address, account.chainId, dailyLimitUsdCents);
  } catch (err) {
    if (spinner) spinner.stop();
    const msg = (err as Error).message ?? '';
    if (msg.includes('EMAIL') || msg.includes('email') || msg.includes('NOT_FOUND')) {
      throw new CliError(ErrorCode.EMAIL_NOT_BOUND, 'Email not bound. Run `elytro security email bind <email>` first.');
    }
    throw new CliError(ErrorCode.HOOK_AUTH_FAILED, sanitizeErrorMessage(msg));
  }
  if (spinner) spinner.stop();

  if (!isJsonMode()) {
    display.info('OTP sent to', otpResult.maskedEmail);
  }

  const otpCode = await askInput('Enter the 6-digit OTP code:');

  const setSpinner = isJsonMode() ? null : ora('Setting daily limit...').start();
  try {
    await hookService.setDailyLimit(account.address, account.chainId, dailyLimitUsdCents, otpCode.trim());
    if (setSpinner) setSpinner.stop();

    outputSuccess({
      status: 'updated',
      account: account.alias,
      address: account.address,
      dailyLimitUsd: amountUsd,
    });
  } catch (err) {
    if (setSpinner) setSpinner.stop();
    throw new CliError(
      ErrorCode.OTP_VERIFY_FAILED,
      `Failed to set limit: ${sanitizeErrorMessage((err as Error).message)}`
    );
  }
}
