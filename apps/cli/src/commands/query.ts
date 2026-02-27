import { Command } from 'commander';
import ora from 'ora';
import { isAddress, formatEther, formatUnits } from 'viem';
import type { Address } from 'viem';
import type { AppContext } from '../context';
import type { ChainConfig } from '../types';
import { getTokenInfo, getTokenBalance } from '../utils/erc20';
import * as display from '../utils/display';
import { maskApiKeys, sanitizeErrorMessage } from '../utils/display';

/**
 * `elytro query` — Read-only on-chain queries.
 *
 * Subcommands:
 *   balance   — ETH or ERC-20 balance of an account
 *   tokens    — All ERC-20 token holdings (via Alchemy)
 *   tx        — Transaction receipt by hash
 *   chain     — Current chain info (id, block, gasPrice)
 *   address   — Inspect any address (EOA/contract, balance, code size)
 */
export function registerQueryCommand(program: Command, ctx: AppContext): void {
  const query = program.command('query').description('Query on-chain data');

  // ─── balance ──────────────────────────────────────────────────

  query
    .command('balance')
    .description('Query ETH or ERC-20 balance')
    .argument('[account]', 'Account alias or address (default: current)')
    .option('--token <address>', 'ERC-20 token contract address')
    .action(async (target?: string, opts?: { token?: string }) => {
      try {
        const { accountInfo, chainConfig } = resolveAccountAndChain(ctx, target);
        ctx.walletClient.initForChain(chainConfig);

        const spinner = ora('Querying balance...').start();

        if (opts?.token) {
          // ERC-20 balance
          if (!isAddress(opts.token)) {
            spinner.fail('Invalid token address.');
            outputError(-32602, 'Invalid token address.', { token: opts.token });
            return;
          }

          const [tokenInfo, tokenBal] = await Promise.all([
            getTokenInfo(ctx.walletClient, opts.token as Address),
            getTokenBalance(ctx.walletClient, opts.token as Address, accountInfo.address),
          ]);
          spinner.stop();

          outputSuccess({
            account: accountInfo.alias,
            address: accountInfo.address,
            chain: chainConfig.name,
            token: opts.token,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            balance: formatUnits(tokenBal, tokenInfo.decimals),
          });
        } else {
          // Native ETH balance
          const { ether } = await ctx.walletClient.getBalance(accountInfo.address);
          spinner.stop();

          outputSuccess({
            account: accountInfo.alias,
            address: accountInfo.address,
            chain: chainConfig.name,
            symbol: chainConfig.nativeCurrency.symbol,
            balance: ether,
          });
        }
      } catch (err) {
        outputError(-32000, sanitizeErrorMessage((err as Error).message));
      }
    });

  // ─── tokens ───────────────────────────────────────────────────

  query
    .command('tokens')
    .description('List all ERC-20 token holdings')
    .argument('[account]', 'Account alias or address (default: current)')
    .action(async (target?: string) => {
      try {
        const { accountInfo, chainConfig } = resolveAccountAndChain(ctx, target);
        ctx.walletClient.initForChain(chainConfig);

        const spinner = ora('Fetching token balances...').start();

        // Step 1: Get all token addresses with non-zero balances
        const rawBalances = await ctx.walletClient.getTokenBalances(accountInfo.address);

        if (rawBalances.length === 0) {
          spinner.stop();
          display.heading(`Token Holdings (${accountInfo.alias})`);
          display.info('Result', 'No ERC-20 tokens found.');
          return;
        }

        // Step 2: Fetch symbol + decimals for each token in parallel
        spinner.text = `Fetching metadata for ${rawBalances.length} tokens...`;

        const tokens = await Promise.all(
          rawBalances.map(async ({ tokenAddress, balance }) => {
            try {
              const info = await getTokenInfo(ctx.walletClient, tokenAddress);
              return {
                address: tokenAddress,
                symbol: info.symbol,
                decimals: info.decimals,
                balance: formatUnits(balance, info.decimals),
                rawBalance: balance,
              };
            } catch {
              // Some tokens may not implement symbol/decimals properly
              return {
                address: tokenAddress,
                symbol: '???',
                decimals: 18,
                balance: formatUnits(balance, 18),
                rawBalance: balance,
              };
            }
          })
        );

        spinner.stop();

        display.heading(`Token Holdings (${accountInfo.alias})`);
        display.info('Account', accountInfo.address);
        display.info('Chain', `${chainConfig.name} (${chainConfig.id})`);
        display.info('Tokens', tokens.length.toString());
        console.log('');

        display.table(
          tokens.map((t) => ({
            address: t.address,
            symbol: t.symbol,
            decimals: String(t.decimals),
            balance: t.balance,
          })),
          [
            { key: 'address', label: 'Token Address', width: 44 },
            { key: 'symbol', label: 'Symbol', width: 10 },
            { key: 'decimals', label: 'Decimals', width: 10 },
            { key: 'balance', label: 'Balance', width: 24 },
          ]
        );
      } catch (err) {
        outputError(-32000, sanitizeErrorMessage((err as Error).message));
      }
    });

  // ─── tx ───────────────────────────────────────────────────────

  query
    .command('tx')
    .description('Query transaction status by hash')
    .argument('<hash>', 'Transaction hash (0x...)')
    .action(async (hash: string) => {
      try {
        if (!hash || !isHex66(hash)) {
          outputError(-32602, 'Invalid transaction hash. Must be a 66-character hex string (0x + 64 hex chars).', {
            hash,
          });
          return;
        }

        // Need a chain context to query — use current chain
        const chainConfig = resolveCurrentChain(ctx);
        ctx.walletClient.initForChain(chainConfig);

        const spinner = ora('Querying transaction...').start();
        const receipt = await ctx.walletClient.getTransactionReceipt(hash as `0x${string}`);

        if (!receipt) {
          spinner.stop();
          outputError(-32001, 'Transaction not found. It may be pending or on a different chain.', {
            hash,
            chain: chainConfig.name,
          });
          return;
        }

        spinner.stop();

        outputSuccess({
          hash: receipt.transactionHash,
          status: receipt.status,
          block: receipt.blockNumber.toString(),
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          chain: chainConfig.name,
        });
      } catch (err) {
        outputError(-32000, sanitizeErrorMessage((err as Error).message));
      }
    });

  // ─── chain ────────────────────────────────────────────────────

  query
    .command('chain')
    .description('Show current chain information')
    .action(async () => {
      try {
        const chainConfig = resolveCurrentChain(ctx);
        ctx.walletClient.initForChain(chainConfig);

        const spinner = ora('Fetching chain data...').start();

        const [blockNumber, gasPrice] = await Promise.all([
          ctx.walletClient.getBlockNumber(),
          ctx.walletClient.getGasPrice(),
        ]);

        spinner.stop();

        outputSuccess({
          chainId: chainConfig.id,
          name: chainConfig.name,
          nativeCurrency: chainConfig.nativeCurrency.symbol,
          rpcEndpoint: maskApiKeys(chainConfig.endpoint),
          bundler: maskApiKeys(chainConfig.bundler),
          blockExplorer: chainConfig.blockExplorer ?? null,
          blockNumber: blockNumber.toString(),
          gasPrice: `${gasPrice.toString()} wei (${formatEther(gasPrice * 21000n)} ETH per basic tx)`,
        });
      } catch (err) {
        outputError(-32000, sanitizeErrorMessage((err as Error).message));
      }
    });

  // ─── address ──────────────────────────────────────────────────

  query
    .command('address')
    .description('Inspect any on-chain address')
    .argument('<address>', 'Address to inspect (0x...)')
    .action(async (addr: string) => {
      try {
        if (!isAddress(addr)) {
          outputError(-32602, 'Invalid address.', { address: addr });
          return;
        }

        const chainConfig = resolveCurrentChain(ctx);
        ctx.walletClient.initForChain(chainConfig);

        const spinner = ora('Querying address...').start();

        const [{ ether: balance }, code] = await Promise.all([
          ctx.walletClient.getBalance(addr as Address),
          ctx.walletClient.getCode(addr as Address),
        ]);

        const isContract = !!code && code !== '0x';
        const codeSize = isContract ? (code!.length - 2) / 2 : 0;

        spinner.stop();

        outputSuccess({
          address: addr,
          chain: chainConfig.name,
          type: isContract ? 'contract' : 'EOA',
          balance: `${balance} ${chainConfig.nativeCurrency.symbol}`,
          ...(isContract ? { codeSize: `${codeSize} bytes` } : {}),
        });
      } catch (err) {
        outputError(-32000, sanitizeErrorMessage((err as Error).message));
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
    throw new Error('No account selected. Specify an alias/address or create an account first.');
  }

  const accountInfo = ctx.account.resolveAccount(identifier);
  if (!accountInfo) {
    throw new Error(`Account "${identifier}" not found.`);
  }

  const chainConfig = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
  if (!chainConfig) {
    throw new Error(`Chain ${accountInfo.chainId} not configured.`);
  }

  return { accountInfo, chainConfig };
}

/**
 * Resolve the effective chain for query commands that don't take an account argument.
 *
 * Priority:
 *   1. Current account's chain (from accountInfo.chainId)
 *   2. Fallback to ctx.chain.currentChain (config default)
 *
 * This prevents the mismatch where config says Optimism Sepolia but
 * the active account lives on Sepolia.
 */
function resolveCurrentChain(ctx: AppContext): ChainConfig {
  const currentAccount = ctx.account.currentAccount;
  if (currentAccount) {
    const accountInfo = ctx.account.resolveAccount(currentAccount.alias ?? currentAccount.address);
    if (accountInfo) {
      const chain = ctx.chain.chains.find((c) => c.id === accountInfo.chainId);
      if (chain) return chain;
    }
  }
  return ctx.chain.currentChain;
}

function isHex66(s: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(s);
}

/**
 * Output structured success result (aligned with tx module error format).
 */
function outputSuccess(result: Record<string, unknown>): void {
  console.log(JSON.stringify({ success: true, result }, null, 2));
}

/**
 * Output structured error (same format as tx module).
 */
function outputError(code: number, message: string, data?: Record<string, unknown>): void {
  display.txError({ code, message, data });
  process.exitCode = 1;
}
