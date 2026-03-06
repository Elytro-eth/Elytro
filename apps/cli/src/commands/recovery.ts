import { Command } from 'commander';
import ora from 'ora';
import { isAddress } from 'viem';
import type { Address } from 'viem';
import type { AppContext } from '../context';
import type { ChainConfig, TRecoveryContact, TRecoveryRecord } from '../types';
import { RecoveryStatusEn } from '../types';
import * as display from '../utils/display';
import { outputSuccess, handleError, ErrorCode, isJsonMode, CliError } from '../utils/output';
import { requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';

/**
 * `elytro recovery` — Social recovery lifecycle management.
 *
 * Subcommands:
 *   info      — Query on-chain recovery configuration
 *   setup     — Configure guardian contacts and threshold
 *   start     — Initiate account recovery
 *   status    — Check recovery progress (guardian signatures + on-chain state)
 *   execute   — Generate the recovery execution transaction
 *   clear     — Remove local recovery record
 */
export function registerRecoveryCommand(program: Command, ctx: AppContext): void {
  const recovery = program.command('recovery').description('Social recovery — guardian-based account recovery');

  // ─── info ──────────────────────────────────────────────────────

  recovery
    .command('info')
    .description('Query on-chain recovery configuration for an account')
    .argument('[account]', 'Account alias or address (default: current)')
    .action(async (target?: string) => {
      let spinner: ReturnType<typeof ora> | null = null;
      try {
        const { accountInfo, chainConfig } = resolveAccountAndChain(ctx, target);
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        spinner = isJsonMode() ? null : ora('Querying recovery info...').start();

        const [recoveryInfo, contacts] = await Promise.all([
          ctx.recovery.getRecoveryInfo(accountInfo.address),
          ctx.recovery.queryRecoveryContacts(accountInfo.address),
        ]);

        // Check for local recovery record
        const localRecord = await ctx.recovery.getRecoveryRecord(accountInfo.address);

        if (spinner) spinner.stop();

        const DEFAULT_HASH = '0x' + '0'.repeat(64);
        const hasGuardians = recoveryInfo && recoveryInfo.contactsHash !== DEFAULT_HASH;

        outputSuccess({
          account: accountInfo.alias,
          address: accountInfo.address,
          chain: chainConfig.name,
          onChain: {
            hasGuardians: !!hasGuardians,
            contactsHash: recoveryInfo?.contactsHash ?? null,
            nonce: recoveryInfo ? Number(recoveryInfo.nonce) : null,
            delayPeriod: recoveryInfo ? Number(recoveryInfo.delayPeriod) : null,
            delayPeriodHours: recoveryInfo ? Number(recoveryInfo.delayPeriod) / 3600 : null,
          },
          contacts: contacts
            ? {
                guardians: contacts.contacts,
                threshold: contacts.threshold,
                salt: contacts.salt,
              }
            : null,
          localRecord: localRecord
            ? {
                status: statusLabel(localRecord.status),
                statusCode: localRecord.status,
                approveHash: localRecord.approveHash,
                recoveryID: localRecord.recoveryID,
                signedCount: localRecord.contacts.filter((c) => c.confirmed).length,
                threshold: localRecord.threshold,
              }
            : null,
        });
      } catch (err) {
        if (spinner) spinner.stop();
        handleError(err);
      }
    });

  // ─── setup ─────────────────────────────────────────────────────

  recovery
    .command('setup')
    .description('Configure recovery guardians')
    .requiredOption('--guardians <addresses...>', 'Guardian wallet addresses (space-separated)')
    .requiredOption('--threshold <n>', 'Minimum number of guardian signatures required')
    .option('--privacy', 'Privacy mode — do not record contacts on-chain')
    .argument('[account]', 'Account alias or address (default: current)')
    .action(async (target: string | undefined, opts: { guardians: string[]; threshold: string; privacy?: boolean }) => {
      let spinner: ReturnType<typeof ora> | null = null;
      try {
        const { accountInfo, chainConfig } = resolveAccountAndChain(ctx, target);
        const threshold = parseInt(opts.threshold, 10);

        // Validate inputs
        if (isNaN(threshold) || threshold < 1) {
          throw new CliError(ErrorCode.INVALID_PARAMS, 'Threshold must be a positive integer.', {
            threshold: opts.threshold,
          });
        }
        if (threshold > opts.guardians.length) {
          throw new CliError(
            ErrorCode.INVALID_PARAMS,
            `Threshold (${threshold}) cannot exceed number of guardians (${opts.guardians.length}).`
          );
        }
        for (const addr of opts.guardians) {
          if (!isAddress(addr)) {
            throw new CliError(ErrorCode.INVALID_PARAMS, `Invalid guardian address: ${addr}`);
          }
        }

        // Check if anything changed
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        const changed = await ctx.recovery.checkRecoveryContactsSettingChanged(
          accountInfo.address,
          opts.guardians,
          threshold
        );

        if (!changed) {
          outputSuccess({
            status: 'unchanged',
            message: 'Guardian configuration is already up to date.',
            account: accountInfo.alias,
          });
          return;
        }

        // Generate transactions
        const txs = ctx.recovery.generateRecoverySetupTxs(opts.guardians, threshold, !!opts.privacy);

        spinner = isJsonMode() ? null : ora('Building setup transactions...').start();

        // Build and send each transaction as a UserOp
        const txHashes: string[] = [];
        let sponsored = false;

        for (const tx of txs) {
          const userOp = await ctx.sdk.createSendUserOp(accountInfo.address, [tx]);

          // Get gas prices
          const feeData = await ctx.sdk.getFeeData(chainConfig);
          userOp.maxFeePerGas = feeData.maxFeePerGas;
          userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

          // Estimate gas with fakeBalance to avoid AA21 on unfunded accounts
          const gas = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
          userOp.callGasLimit = gas.callGasLimit;
          userOp.verificationGasLimit = gas.verificationGasLimit;
          userOp.preVerificationGas = gas.preVerificationGas;

          // Try sponsorship (gasless execution)
          if (spinner) spinner.text = 'Checking sponsorship...';
          const { sponsor: sponsorResult } = await requestSponsorship(
            ctx.chain.graphqlEndpoint,
            chainConfig.id,
            ctx.sdk.entryPoint,
            userOp
          );
          if (sponsorResult) {
            applySponsorToUserOp(userOp, sponsorResult);
            sponsored = true;
          }

          // Sign
          const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
          const owner = ctx.keyring.currentOwner;
          if (!owner) throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'Keyring is locked.');

          const rawSig = await ctx.keyring.signDigest(packedHash);
          userOp.signature = await ctx.sdk.packUserOpSignature(rawSig, validationData);

          // Send
          if (spinner) spinner.text = `Sending guardian setup transaction (${txHashes.length + 1}/${txs.length})...`;
          const opHash = await ctx.sdk.sendUserOp(userOp);
          const receipt = await ctx.sdk.waitForReceipt(opHash);
          txHashes.push(receipt.transactionHash);
        }

        if (spinner) spinner.stop();

        // Update account state
        await ctx.account.updateAccountRecoveryState(accountInfo.address, true);

        const guardianHash = ctx.sdk.calculateRecoveryContactsHash(opts.guardians, threshold);

        outputSuccess({
          status: 'configured',
          account: accountInfo.alias,
          address: accountInfo.address,
          chain: chainConfig.name,
          guardians: opts.guardians,
          threshold,
          privacyMode: !!opts.privacy,
          guardianHash,
          sponsored,
          txHashes,
        });
      } catch (err) {
        if (spinner) spinner.stop();
        handleError(err);
      }
    });

  // ─── start ─────────────────────────────────────────────────────

  recovery
    .command('start')
    .description('Start a recovery operation for a wallet (uses current EOA as new owner)')
    .argument('<wallet>', 'Smart account address to recover')
    .requiredOption('-c, --chain <chainId>', 'Chain ID where the wallet is deployed')
    .option('--guardians <addresses...>', 'Guardian addresses (required if privacy mode was used)')
    .option('--threshold <n>', 'Guardian threshold (required if privacy mode was used)')
    .action(async (wallet: string, opts: { chain: string; guardians?: string[]; threshold?: string }) => {
      let spinner: ReturnType<typeof ora> | null = null;
      try {
        if (!isAddress(wallet)) {
          throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid wallet address.');
        }

        const newOwner = ctx.keyring.currentOwner;
        if (!newOwner) {
          throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'No account unlocked. Unlock or create an account first.');
        }

        const chainConfig = resolveChainStrict(ctx, Number(opts.chain));
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        spinner = isJsonMode() ? null : ora('Initiating recovery...').start();

        // Check if current EOA is already the owner of the target wallet
        const alreadyOwner = await ctx.sdk.isOwnerOf(wallet as Address, newOwner);
        if (alreadyOwner) {
          if (spinner) spinner.stop();
          throw new CliError(
            ErrorCode.INVALID_PARAMS,
            'Cannot recover this account on this device — you already own it.'
          );
        }

        // Try to get contacts from on-chain first
        let contacts: TRecoveryContact[];
        let threshold: number;

        const onchainContacts = await ctx.recovery.queryRecoveryContacts(wallet as Address);
        if (onchainContacts) {
          contacts = onchainContacts.contacts.map((addr) => ({
            address: addr,
            confirmed: false,
          }));
          threshold = onchainContacts.threshold;
        } else if (opts.guardians && opts.threshold) {
          // Privacy mode: contacts provided manually
          contacts = opts.guardians.map((addr) => ({
            address: addr,
            confirmed: false,
          }));
          threshold = parseInt(opts.threshold, 10);
        } else {
          if (spinner) spinner.stop();
          throw new CliError(
            ErrorCode.INVALID_PARAMS,
            'No recovery contacts found on-chain. For wallets using privacy mode, provide --guardians and --threshold.',
            { wallet }
          );
        }

        // Create the recovery record
        const record = await ctx.recovery.startRecovery(
          wallet as Address,
          newOwner as Address,
          chainConfig.id,
          contacts,
          threshold
        );

        if (spinner) spinner.stop();

        const shareLink = generateRecoveryShareLink(record);

        outputSuccess({
          status: 'started',
          wallet,
          chain: chainConfig.name,
          chainId: chainConfig.id,
          newOwner,
          approveHash: record.approveHash,
          recoveryID: record.recoveryID,
          guardians: record.contacts.map((c) => c.address),
          threshold: record.threshold,
          shareLink,
          hint: 'Share this link with guardians so they can approve the recovery.',
        });
      } catch (err) {
        if (spinner) spinner.stop();
        handleError(err);
      }
    });

  // ─── status ────────────────────────────────────────────────────

  recovery
    .command('status')
    .description('Check recovery progress')
    .argument('<wallet>', 'Wallet address to check')
    .requiredOption('-c, --chain <chainId>', 'Chain ID where the wallet is deployed')
    .option('--poll', 'Update status by checking on-chain state')
    .action(async (wallet: string, opts: { chain: string; poll?: boolean }) => {
      try {
        if (!isAddress(wallet)) {
          throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid wallet address.');
        }

        const chainConfig = resolveChainStrict(ctx, Number(opts.chain));
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        // Optionally refresh from on-chain
        if (opts?.poll) {
          const spinner = isJsonMode() ? null : ora('Polling on-chain status...').start();
          const changed = await ctx.recovery.updateRecoveryStatus(wallet);
          if (spinner) spinner.stop();
          if (changed && !isJsonMode()) {
            display.success('Status updated.');
          }
        }

        const record = await ctx.recovery.getRecoveryRecord(wallet);
        if (!record) {
          outputSuccess({
            status: 'none',
            message: 'No active recovery record found.',
            wallet,
          });
          return;
        }

        const signedCount = record.contacts.filter((c) => c.confirmed).length;

        outputSuccess({
          wallet: record.address,
          chain: record.chainId,
          status: statusLabel(record.status),
          statusCode: record.status,
          newOwner: record.owner,
          approveHash: record.approveHash,
          recoveryID: record.recoveryID,
          signatures: {
            signed: signedCount,
            threshold: record.threshold,
            total: record.contacts.length,
          },
          guardians: record.contacts.map((c) => ({
            address: c.address,
            label: c.label ?? null,
            signed: !!c.confirmed,
          })),
        });
      } catch (err) {
        handleError(err);
      }
    });

  // ─── execute ───────────────────────────────────────────────────

  recovery
    .command('execute')
    .description('Generate recovery execution transaction (after guardian approval)')
    .argument('<wallet>', 'Wallet address to recover')
    .requiredOption('-c, --chain <chainId>', 'Chain ID where the wallet is deployed')
    .action(async (wallet: string, opts: { chain: string }) => {
      let spinner: ReturnType<typeof ora> | null = null;
      try {
        if (!isAddress(wallet)) {
          throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid wallet address.');
        }

        const chainConfig = resolveChainStrict(ctx, Number(opts.chain));
        ctx.walletClient.initForChain(chainConfig);
        await ctx.sdk.initForChain(chainConfig);

        spinner = isJsonMode() ? null : ora('Generating recovery transaction...').start();

        // First refresh status
        await ctx.recovery.updateRecoveryStatus(wallet);

        const tx = await ctx.recovery.generateRecoveryExecutionTx(wallet);

        if (spinner) spinner.stop();

        if (!tx) {
          const record = await ctx.recovery.getRecoveryRecord(wallet);
          throw new CliError(
            ErrorCode.ACCOUNT_NOT_READY,
            record
              ? `Recovery not ready for execution. Current status: ${statusLabel(record.status)}`
              : 'No active recovery record found.',
            { wallet }
          );
        }

        outputSuccess({
          status: 'ready',
          message: 'Recovery transaction generated. Submit this from a funded EOA.',
          transaction: {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          },
          chain: chainConfig.name,
          chainId: chainConfig.id,
          hint: 'This is a direct contract call to SocialRecoveryModule.recovery(). Send it from any funded EOA.',
        });
      } catch (err) {
        if (spinner) spinner.stop();
        handleError(err);
      }
    });

  // ─── clear ─────────────────────────────────────────────────────

  recovery
    .command('clear')
    .description('Clear local recovery record')
    .argument('[wallet]', 'Wallet address (default: current account)')
    .action(async (wallet?: string) => {
      try {
        const address = wallet ?? ctx.account.currentAccount?.address;
        if (!address) {
          throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'No wallet specified and no current account.');
        }

        const record = await ctx.recovery.getRecoveryRecord(address);
        if (!record) {
          outputSuccess({
            status: 'none',
            message: 'No recovery record to clear.',
            wallet: address,
          });
          return;
        }

        await ctx.recovery.clearRecoveryRecord(address);

        outputSuccess({
          status: 'cleared',
          wallet: address,
          previousStatus: statusLabel(record.status),
        });
      } catch (err) {
        handleError(err);
      }
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function resolveAccountAndChain(
  ctx: AppContext,
  target?: string
): { accountInfo: { alias: string; address: Address; chainId: number }; chainConfig: ChainConfig } {
  const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
  if (!identifier) {
    throw new CliError(
      ErrorCode.ACCOUNT_NOT_READY,
      'No account selected. Specify an alias/address or create an account first.'
    );
  }

  const accountInfo = ctx.account.resolveAccount(identifier);
  if (!accountInfo) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `Account "${identifier}" not found.`, { identifier });
  }

  const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
  if (!chainConfig) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `Chain ${accountInfo.chainId} not configured.`, {
      chainId: accountInfo.chainId,
    });
  }

  return { accountInfo, chainConfig };
}

function resolveChainStrict(ctx: AppContext, chainId: number): ChainConfig {
  const chain = ctx.chain.chains.find((c) => c.id === chainId);
  if (!chain) {
    throw new CliError(ErrorCode.INVALID_PARAMS, `Chain ${chainId} not configured.`, { chainId });
  }
  return chain;
}

function statusLabel(status: number): string {
  switch (status) {
    case RecoveryStatusEn.WAITING_FOR_SIGNATURE:
      return 'waiting_for_signatures';
    case RecoveryStatusEn.SIGNATURE_COMPLETED:
      return 'signatures_complete';
    case RecoveryStatusEn.RECOVERY_STARTED:
      return 'recovery_started';
    case RecoveryStatusEn.RECOVERY_READY:
      return 'recovery_ready';
    case RecoveryStatusEn.RECOVERY_COMPLETED:
      return 'recovery_completed';
    default:
      return `unknown(${status})`;
  }
}

const RECOVERY_APP_URL = 'https://recovery.elytro.com';

function generateRecoveryShareLink(record: TRecoveryRecord, path = ''): string {
  const params = new URLSearchParams({
    id: record.recoveryID,
    address: record.address.toString(),
    chainId: record.chainId.toString(),
    hash: record.approveHash,
    from: record.fromBlock,
    owner: record.owner,
    contacts: record.contacts.map((c) => c.address).join(','),
    threshold: record.threshold.toString(),
  });
  return `${RECOVERY_APP_URL}${path}?${params.toString()}`;
}
