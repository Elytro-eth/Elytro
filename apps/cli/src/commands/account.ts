import { Command } from 'commander';
import ora from 'ora';
import { formatEther, padHex } from 'viem';
import type { AppContext } from '../context';
import { askSelect } from '../utils/prompt';
import { registerAccount, requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';
import * as display from '../utils/display';
import { outputSuccess, outputError, ErrorCode, handleError, isJsonMode } from '../utils/output';

/**
 * `elytro account` — Smart account management.
 *
 * Subcommands:
 *   create   — Calculate counterfactual address and register locally
 *   activate — Deploy the smart contract on-chain via UserOp
 *   list     — Show all accounts
 *   info     — Display current account details with on-chain data
 *   switch   — Change the active account
 *
 * Design:
 * - Owner (EOA) is never shown to users
 * - Accounts are identified by alias (e.g. "swift-panda") or address
 * - Chain is required at creation time
 * - No password needed — keyring is auto-unlocked via SecretProvider at boot
 */
export function registerAccountCommand(program: Command, ctx: AppContext): void {
  const account = program.command('account').description('Manage smart accounts');

  // ─── create ───────────────────────────────────────────────────

  account
    .command('create')
    .description('Create a new smart account')
    .requiredOption('-c, --chain <chainId>', 'Target chain ID')
    .option('-a, --alias <alias>', 'Human-readable alias (default: random)')
    .action(async (opts) => {
      if (!ctx.keyring.isUnlocked) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
        return;
      }

      const chainId = Number(opts.chain);

      if (Number.isNaN(chainId)) {
        outputError(ErrorCode.INVALID_PARAMS, 'Invalid chain ID.', { chain: opts.chain });
        return;
      }

      const spinner = isJsonMode() ? null : ora('Creating smart account...').start();
      try {
        // Initialize SDK for the target chain before address calculation
        const chainConfig = ctx.chain.chains.find((c) => c.id === chainId);
        const chainName = chainConfig?.name ?? String(chainId);
        if (chainConfig) {
          await ctx.sdk.initForChain(chainConfig);
          ctx.walletClient.initForChain(chainConfig);
        }

        const accountInfo = await ctx.account.createAccount(chainId, opts.alias);

        // Register with Elytro backend (required for sponsorship)
        if (spinner) spinner.text = 'Registering with backend...';
        const { guardianHash, guardianSafePeriod } = ctx.sdk.initDefaults;
        const paddedKey = padHex(accountInfo.owner, { size: 32 });
        const { error: regError } = await registerAccount(
          ctx.chain.graphqlEndpoint,
          accountInfo.address,
          chainId,
          accountInfo.index,
          [paddedKey],
          guardianHash,
          guardianSafePeriod
        );

        if (spinner) spinner.succeed(`Account "${accountInfo.alias}" created.`);

        const result: Record<string, unknown> = {
          alias: accountInfo.alias,
          address: accountInfo.address,
          chainId,
          chainName,
          deployed: false,
        };

        if (regError) {
          result.backendRegistration = 'failed';
          result.backendError = regError;
          if (!isJsonMode()) {
            display.warn(`Backend registration failed: ${regError}`);
            display.warn('Sponsorship may not work. You can still activate with ETH.');
          }
        } else {
          result.backendRegistration = 'ok';
        }

        outputSuccess(result);
      } catch (err) {
        if (spinner) spinner.fail('Failed to create account.');
        handleError(err);
      }
    });

  // ─── activate ───────────────────────────────────────────────────

  account
    .command('activate')
    .description('Deploy the smart contract on-chain')
    .argument('[account]', 'Alias or address (default: current)')
    .option('--no-sponsor', 'Skip sponsorship check (user pays gas)')
    .action(async (target?: string, opts?: { sponsor?: boolean }) => {
      if (!ctx.keyring.isUnlocked) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
        return;
      }

      // 1. Resolve account
      const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
      if (!identifier) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'No account selected.', {
          hint: 'Specify an alias/address or create an account first.',
        });
        return;
      }

      const accountInfo = ctx.account.resolveAccount(identifier);
      if (!accountInfo) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, `Account "${identifier}" not found.`, { identifier });
        return;
      }

      // 2. Check if already deployed
      if (accountInfo.isDeployed) {
        outputSuccess({
          status: 'already_deployed',
          alias: accountInfo.alias,
          address: accountInfo.address,
          chainId: accountInfo.chainId,
        });
        return;
      }

      const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
      const chainName = chainConfig?.name ?? String(accountInfo.chainId);

      if (!chainConfig) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, `Chain ${accountInfo.chainId} not configured.`, {
          chainId: accountInfo.chainId,
        });
        return;
      }

      // Ensure SDK is initialized for the account's chain
      await ctx.sdk.initForChain(chainConfig);
      ctx.walletClient.initForChain(chainConfig);

      const spinner = isJsonMode() ? null : ora(`Activating "${accountInfo.alias}" on ${chainName}...`).start();

      try {
        // 3. Create unsigned deploy UserOp
        if (spinner) spinner.text = 'Building deployment UserOp...';
        const userOp = await ctx.sdk.createDeployUserOp(accountInfo.owner, accountInfo.index);

        // 4. Get fee data from Pimlico bundler
        if (spinner) spinner.text = 'Fetching gas prices...';
        const feeData = await ctx.sdk.getFeeData(chainConfig);
        userOp.maxFeePerGas = feeData.maxFeePerGas;
        userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        // 5. Estimate gas (with fakeBalance to prevent AA21 on undeployed accounts)
        if (spinner) spinner.text = 'Estimating gas...';
        const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
        userOp.callGasLimit = gasEstimate.callGasLimit;
        userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
        userOp.preVerificationGas = gasEstimate.preVerificationGas;

        // 6. Try sponsorship (unless --no-sponsor)
        let sponsored = false;
        if (opts?.sponsor !== false) {
          if (spinner) spinner.text = 'Checking sponsorship...';
          const { sponsor: sponsorResult, error: sponsorError } = await requestSponsorship(
            ctx.chain.graphqlEndpoint,
            accountInfo.chainId,
            ctx.sdk.entryPoint,
            userOp
          );

          if (sponsorResult) {
            applySponsorToUserOp(userOp, sponsorResult);
            sponsored = true;
          } else {
            // Sponsor failed — check if account has funds to self-pay
            if (spinner) spinner.text = 'Sponsorship unavailable, checking balance...';
            const { ether: balance } = await ctx.walletClient.getBalance(accountInfo.address);
            if (parseFloat(balance) === 0) {
              if (spinner) spinner.fail('Activation failed.');
              outputError(ErrorCode.SPONSOR_FAILED, 'Sponsorship failed and account has no ETH to pay gas.', {
                reason: sponsorError ?? 'unknown',
                account: accountInfo.address,
                chain: chainName,
                hint: `Fund ${accountInfo.address} on ${chainName}, or fix sponsorship.`,
              });
              return;
            }
            // Account has funds — proceed without sponsor
            if (spinner) spinner.text = 'Proceeding without sponsor (user pays gas)...';
          }
        }

        // 7. Compute hash and sign
        if (spinner) spinner.text = 'Signing UserOperation...';
        const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);

        // Raw ECDSA sign (no EIP-191 prefix)
        const rawSignature = await ctx.keyring.signDigest(packedHash);

        // Pack signature with validator + validation data
        userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

        // 8. Send to bundler
        if (spinner) spinner.text = 'Sending to bundler...';
        const opHash = await ctx.sdk.sendUserOp(userOp);

        // 9. Wait for receipt
        if (spinner) spinner.text = 'Waiting for on-chain confirmation...';
        const receipt = await ctx.sdk.waitForReceipt(opHash);

        // 10. Update local state
        await ctx.account.markDeployed(accountInfo.address, accountInfo.chainId);

        if (receipt.success) {
          if (spinner) spinner.succeed(`Account "${accountInfo.alias}" activated!`);
        } else {
          if (spinner) spinner.warn(`UserOp included but execution reverted.`);
        }

        outputSuccess({
          status: receipt.success ? 'activated' : 'reverted',
          alias: accountInfo.alias,
          address: accountInfo.address,
          chainId: accountInfo.chainId,
          chainName,
          txHash: receipt.transactionHash,
          gasCost: `${formatEther(BigInt(receipt.actualGasCost))} ETH`,
          sponsored,
          ...(chainConfig.blockExplorer
            ? { explorerUrl: `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}` }
            : {}),
        });

        if (!receipt.success) {
          process.exitCode = 1;
        }
      } catch (err) {
        if (spinner) spinner.fail('Activation failed.');
        handleError(err);
      }
    });

  // ─── list ─────────────────────────────────────────────────────

  account
    .command('list')
    .description('List all accounts (or query one by alias/address)')
    .argument('[account]', 'Filter by alias or address')
    .option('-c, --chain <chainId>', 'Filter by chain ID')
    .action(async (target?: string, opts?: { chain?: string }) => {
      let accounts = opts?.chain ? ctx.account.getAccountsByChain(Number(opts.chain)) : ctx.account.allAccounts;

      // Filter by alias or address if provided
      if (target) {
        const matched = ctx.account.resolveAccount(target);
        if (!matched) {
          outputError(ErrorCode.ACCOUNT_NOT_READY, `Account "${target}" not found.`, { identifier: target });
          return;
        }
        accounts = [matched];
      }

      if (accounts.length === 0) {
        outputSuccess({
          accounts: [],
          hint: 'Run `elytro account create --chain <chainId>` first.',
        });
        return;
      }

      const current = ctx.account.currentAccount;

      const accountList = accounts.map((a) => {
        const chainConfig = ctx.chain.chains.find((c) => c.id === a.chainId);
        return {
          active: a.address === current?.address,
          alias: a.alias,
          address: a.address,
          chainId: a.chainId,
          chainName: chainConfig?.name ?? String(a.chainId),
          deployed: a.isDeployed,
          recoveryEnabled: a.isRecoveryEnabled,
        };
      });

      // Human-readable table in non-JSON mode
      if (!isJsonMode()) {
        display.heading('Accounts');
        display.table(
          accountList.map((a) => ({
            active: a.active ? '→' : ' ',
            alias: a.alias,
            address: a.address,
            chain: a.chainName,
            deployed: a.deployed ? 'Yes' : 'No',
            recovery: a.recoveryEnabled ? 'Yes' : 'No',
          })),
          [
            { key: 'active', label: '', width: 3 },
            { key: 'alias', label: 'Alias', width: 16 },
            { key: 'address', label: 'Address', width: 44 },
            { key: 'chain', label: 'Chain', width: 18 },
            { key: 'deployed', label: 'Deployed', width: 10 },
            { key: 'recovery', label: 'Recovery', width: 10 },
          ]
        );
      }

      outputSuccess({ accounts: accountList });
    });

  // ─── info ─────────────────────────────────────────────────────

  account
    .command('info')
    .description('Show details for an account')
    .argument('[account]', 'Alias or address (default: current)')
    .action(async (target?: string) => {
      const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;

      if (!identifier) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'No account selected.', {
          hint: 'Run `elytro account create --chain <chainId>` first.',
        });
        return;
      }

      const spinner = isJsonMode() ? null : ora('Fetching on-chain data...').start();
      try {
        // Resolve account first to get its chainId, then init walletClient for that chain
        const accountInfo = ctx.account.resolveAccount(identifier);
        if (!accountInfo) {
          if (spinner) spinner.fail('Account not found.');
          outputError(ErrorCode.ACCOUNT_NOT_READY, `Account "${identifier}" not found.`, { identifier });
          return;
        }
        const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
        if (chainConfig) {
          ctx.walletClient.initForChain(chainConfig);
        }

        const detail = await ctx.account.getAccountDetail(identifier);
        if (spinner) spinner.stop();

        outputSuccess({
          alias: detail.alias,
          address: detail.address,
          chainId: detail.chainId,
          chainName: chainConfig?.name ?? String(detail.chainId),
          deployed: detail.isDeployed,
          balance: detail.balance,
          balanceSymbol: chainConfig?.nativeCurrency.symbol ?? 'ETH',
          recoveryEnabled: detail.isRecoveryEnabled,
          ...(chainConfig?.blockExplorer
            ? { explorerUrl: `${chainConfig.blockExplorer}/address/${detail.address}` }
            : {}),
        });
      } catch (err) {
        if (spinner) spinner.fail('Failed to fetch account info.');
        handleError(err);
      }
    });

  // ─── switch ───────────────────────────────────────────────────

  account
    .command('switch')
    .description('Switch the active account')
    .argument('[account]', 'Alias or address')
    .action(async (target?: string) => {
      const accounts = ctx.account.allAccounts;
      if (accounts.length === 0) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'No accounts found.', {
          hint: 'Run `elytro account create --chain <chainId>` first.',
        });
        return;
      }

      let identifier = target;

      // Interactive selection if no target given (only in human mode)
      if (!identifier) {
        if (isJsonMode()) {
          outputError(ErrorCode.INVALID_PARAMS, 'Account alias or address is required in JSON mode.');
          return;
        }

        const chainConfig = (chainId: number) => ctx.chain.chains.find((c) => c.id === chainId);

        identifier = await askSelect(
          'Select an account',
          accounts.map((a) => ({
            name: `${a.alias}  ${display.address(a.address)}  ${chainConfig(a.chainId)?.name ?? a.chainId}`,
            value: a.alias,
          }))
        );
      }

      try {
        const switched = await ctx.account.switchAccount(identifier);

        // Re-initialize chain-dependent services to match the new account's chain
        const newChain = ctx.chain.chains.find((c) => c.id === switched.chainId);
        if (newChain) {
          ctx.walletClient.initForChain(newChain);
          await ctx.sdk.initForChain(newChain);
        }

        // Try to get balance info
        let balance: string | undefined;
        let balanceSymbol: string | undefined;
        try {
          const detail = await ctx.account.getAccountDetail(switched.alias);
          balance = detail.balance;
          balanceSymbol = newChain?.nativeCurrency.symbol ?? 'ETH';
        } catch {
          // Non-fatal: switch succeeded, just couldn't fetch on-chain data
        }

        outputSuccess({
          status: 'switched',
          alias: switched.alias,
          address: switched.address,
          chainId: switched.chainId,
          chainName: newChain?.name ?? String(switched.chainId),
          deployed: switched.isDeployed,
          ...(balance !== undefined ? { balance, balanceSymbol } : {}),
          ...(newChain?.blockExplorer ? { explorerUrl: `${newChain.blockExplorer}/address/${switched.address}` } : {}),
        });
      } catch (err) {
        handleError(err);
      }
    });
}
