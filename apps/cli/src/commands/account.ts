import { Command } from 'commander';
import ora from 'ora';
import { formatEther, padHex } from 'viem';
import type { AppContext } from '../context';
import { askSelect } from '../utils/prompt';
import { registerAccount, requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';
import * as display from '../utils/display';

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
 * - No password needed — keyring is auto-unlocked via device key at boot
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
      if (!ctx.deviceKey) {
        display.error('Wallet not initialized. Run `elytro init` first.');
        process.exitCode = 1;
        return;
      }

      const chainId = Number(opts.chain);

      if (Number.isNaN(chainId)) {
        display.error('Invalid chain ID.');
        process.exitCode = 1;
        return;
      }

      const spinner = ora('Creating smart account...').start();
      try {
        const accountInfo = await ctx.account.createAccount(chainId, opts.alias);

        const chainConfig = ctx.chain.chains.find((c) => c.id === chainId);
        const chainName = chainConfig?.name ?? String(chainId);

        // Register with Elytro backend (required for sponsorship)
        // Extension does this in sdk.ts calcWalletAddress (line 175)
        spinner.text = 'Registering with backend...';
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

        spinner.succeed(`Account "${accountInfo.alias}" created.`);
        console.log('');
        display.info('Alias', accountInfo.alias);
        display.info('Address', accountInfo.address);
        display.info('Chain', `${chainName} (${chainId})`);
        display.info('Status', 'Not deployed (run `elytro account activate` to deploy)');
        if (regError) {
          display.warn(`Backend registration failed: ${regError}`);
          display.warn('Sponsorship may not work. You can still activate with ETH.');
        }
      } catch (err) {
        spinner.fail('Failed to create account.');
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  // ─── activate ───────────────────────────────────────────────────

  account
    .command('activate')
    .description('Deploy the smart contract on-chain')
    .argument('[account]', 'Alias or address (default: current)')
    .option('--no-sponsor', 'Skip sponsorship check (user pays gas)')
    .action(async (target?: string, opts?: { sponsor?: boolean }) => {
      if (!ctx.deviceKey) {
        display.error('Wallet not initialized. Run `elytro init` first.');
        process.exitCode = 1;
        return;
      }

      // 1. Resolve account
      const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
      if (!identifier) {
        display.warn('No account selected. Specify an alias/address or create an account first.');
        return;
      }

      const accountInfo = ctx.account.resolveAccount(identifier);
      if (!accountInfo) {
        display.error(`Account "${identifier}" not found.`);
        process.exitCode = 1;
        return;
      }

      // 2. Check if already deployed
      if (accountInfo.isDeployed) {
        display.warn(`Account "${accountInfo.alias}" is already deployed.`);
        return;
      }

      const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
      const chainName = chainConfig?.name ?? String(accountInfo.chainId);

      if (!chainConfig) {
        display.error(`Chain ${accountInfo.chainId} not configured.`);
        process.exitCode = 1;
        return;
      }

      // Ensure SDK is initialized for the account's chain
      await ctx.sdk.initForChain(chainConfig);
      ctx.walletClient.initForChain(chainConfig);

      const spinner = ora(`Activating "${accountInfo.alias}" on ${chainName}...`).start();

      try {
        // 3. Create unsigned deploy UserOp
        spinner.text = 'Building deployment UserOp...';
        const userOp = await ctx.sdk.createDeployUserOp(accountInfo.owner, accountInfo.index);

        // 4. Get fee data from Pimlico bundler
        spinner.text = 'Fetching gas prices...';
        const feeData = await ctx.sdk.getFeeData(chainConfig);
        userOp.maxFeePerGas = feeData.maxFeePerGas;
        userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        // 5. Estimate gas (with fakeBalance to prevent AA21 on undeployed accounts)
        spinner.text = 'Estimating gas...';
        const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
        userOp.callGasLimit = gasEstimate.callGasLimit;
        userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
        userOp.preVerificationGas = gasEstimate.preVerificationGas;

        // 6. Try sponsorship (unless --no-sponsor)
        // Extension flow: estimate (with fake balance) → sponsor → sign
        let sponsored = false;
        if (opts?.sponsor !== false) {
          spinner.text = 'Checking sponsorship...';
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
            spinner.text = 'Sponsorship unavailable, checking balance...';
            const { ether: balance } = await ctx.walletClient.getBalance(accountInfo.address);
            if (parseFloat(balance) === 0) {
              spinner.fail('Activation failed.');
              display.error(`Sponsorship failed: ${sponsorError ?? 'unknown reason'}`);
              display.error(
                `Account has no ETH to pay gas. Fund ${accountInfo.address} on ${chainName}, or fix sponsorship.`
              );
              process.exitCode = 1;
              return;
            }
            // Account has funds — proceed without sponsor
            spinner.text = 'Proceeding without sponsor (user pays gas)...';
          }
        }

        // 7. Compute hash and sign
        spinner.text = 'Signing UserOperation...';
        const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);

        // Raw ECDSA sign (no EIP-191 prefix)
        const rawSignature = await ctx.keyring.signDigest(packedHash);

        // Pack signature with validator + validation data
        userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

        // 8. Send to bundler
        spinner.text = 'Sending to bundler...';
        const opHash = await ctx.sdk.sendUserOp(userOp);

        // 9. Wait for receipt
        spinner.text = 'Waiting for on-chain confirmation...';
        const receipt = await ctx.sdk.waitForReceipt(opHash, chainConfig);

        // 10. Update local state
        await ctx.account.markDeployed(accountInfo.address, accountInfo.chainId);

        if (receipt.success) {
          spinner.succeed(`Account "${accountInfo.alias}" activated!`);
        } else {
          spinner.warn(`UserOp included but execution reverted.`);
        }

        console.log('');
        display.info('Account', accountInfo.alias);
        display.info('Address', accountInfo.address);
        display.info('Chain', `${chainName} (${accountInfo.chainId})`);
        display.info('Tx Hash', receipt.transactionHash);
        display.info('Gas Cost', `${formatEther(BigInt(receipt.actualGasCost))} ETH`);
        display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user paid)');

        if (chainConfig.blockExplorer) {
          display.info('Explorer', `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
        }
      } catch (err) {
        spinner.fail('Activation failed.');
        display.error((err as Error).message);
        process.exitCode = 1;
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
          display.error(`Account "${target}" not found.`);
          process.exitCode = 1;
          return;
        }
        accounts = [matched];
      }

      if (accounts.length === 0) {
        display.warn('No accounts found. Run `elytro account create --chain <chainId>` first.');
        return;
      }

      const current = ctx.account.currentAccount;

      display.heading('Accounts');
      display.table(
        accounts.map((a) => {
          const chainConfig = ctx.chain.chains.find((c) => c.id === a.chainId);
          return {
            active: a.address === current?.address ? '→' : ' ',
            alias: a.alias,
            address: a.address,
            chain: chainConfig?.name ?? String(a.chainId),
            deployed: a.isDeployed ? 'Yes' : 'No',
            recovery: a.isRecoveryEnabled ? 'Yes' : 'No',
          };
        }),
        [
          { key: 'active', label: '', width: 3 },
          { key: 'alias', label: 'Alias', width: 16 },
          { key: 'address', label: 'Address', width: 44 },
          { key: 'chain', label: 'Chain', width: 18 },
          { key: 'deployed', label: 'Deployed', width: 10 },
          { key: 'recovery', label: 'Recovery', width: 10 },
        ]
      );
    });

  // ─── info ─────────────────────────────────────────────────────

  account
    .command('info')
    .description('Show details for an account')
    .argument('[account]', 'Alias or address (default: current)')
    .action(async (target?: string) => {
      const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;

      if (!identifier) {
        display.warn('No account selected. Run `elytro account create --chain <chainId>` first.');
        return;
      }

      const spinner = ora('Fetching on-chain data...').start();
      try {
        // Resolve account first to get its chainId, then init walletClient for that chain
        const accountInfo = ctx.account.resolveAccount(identifier);
        if (!accountInfo) {
          spinner.fail('Account not found.');
          display.error(`Account "${identifier}" not found.`);
          process.exitCode = 1;
          return;
        }
        const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
        if (chainConfig) {
          ctx.walletClient.initForChain(chainConfig);
        }

        const detail = await ctx.account.getAccountDetail(identifier);
        spinner.stop();

        display.heading('Account Details');
        display.info('Alias', detail.alias);
        display.info('Address', detail.address);
        display.info('Chain', chainConfig?.name ?? String(detail.chainId));
        display.info('Deployed', detail.isDeployed ? 'Yes' : 'No');
        display.info('Balance', `${detail.balance} ${chainConfig?.nativeCurrency.symbol ?? 'ETH'}`);
        display.info('Recovery', detail.isRecoveryEnabled ? 'Enabled' : 'Not set');

        if (chainConfig?.blockExplorer) {
          display.info('Explorer', `${chainConfig.blockExplorer}/address/${detail.address}`);
        }
      } catch (err) {
        spinner.fail('Failed to fetch account info.');
        display.error((err as Error).message);
        process.exitCode = 1;
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
        display.warn('No accounts found.');
        return;
      }

      let identifier = target;

      // Interactive selection if no target given
      if (!identifier) {
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
        display.success(`Switched to "${switched.alias}"`);
      } catch (err) {
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });
}
