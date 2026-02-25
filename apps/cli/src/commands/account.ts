import { Command } from 'commander';
import ora from 'ora';
import type { AppContext } from '../context';
import { askSelect } from '../utils/prompt';
import * as display from '../utils/display';

/**
 * `elytro account` — Smart account management.
 *
 * Subcommands:
 *   create  — Calculate counterfactual address and register locally
 *   list    — Show all accounts
 *   info    — Display current account details with on-chain data
 *   switch  — Change the active account
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

        spinner.succeed(`Account "${accountInfo.alias}" created.`);
        console.log('');
        display.info('Alias', accountInfo.alias);
        display.info('Address', accountInfo.address);
        display.info('Chain', `${chainName} (${chainId})`);
        display.info('Status', 'Not deployed (deploys on first transaction)');
      } catch (err) {
        spinner.fail('Failed to create account.');
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  // ─── list ─────────────────────────────────────────────────────

  account
    .command('list')
    .description('List all accounts')
    .option('-c, --chain <chainId>', 'Filter by chain ID')
    .action(async (opts) => {
      const accounts = opts.chain ? ctx.account.getAccountsByChain(Number(opts.chain)) : ctx.account.allAccounts;

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
            address: display.address(a.address),
            chain: chainConfig?.name ?? String(a.chainId),
            recovery: a.isRecoveryEnabled ? 'Yes' : 'No',
          };
        }),
        [
          { key: 'active', label: '', width: 3 },
          { key: 'alias', label: 'Alias', width: 16 },
          { key: 'address', label: 'Address', width: 16 },
          { key: 'chain', label: 'Chain', width: 18 },
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
        const detail = await ctx.account.getAccountDetail(identifier);
        const chainConfig = ctx.chain.chains.find((c) => c.id === detail.chainId);
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
