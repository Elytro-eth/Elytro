import { Command } from 'commander';
import type { AppContext } from '../context';
import type { UserKeys } from '../types';
import * as display from '../utils/display';
import { outputSuccess, outputError, ErrorCode } from '../utils/output';

/**
 * `elytro config` — Manage CLI configuration.
 *
 * Subcommands:
 *   elytro config show            — Show current RPC/bundler source & masked keys
 *   elytro config set <key> <val> — Set an API key (alchemy-key | pimlico-key)
 *   elytro config remove <key>    — Remove an API key, revert to public endpoint
 */

const KEY_MAP: Record<string, keyof UserKeys> = {
  'alchemy-key': 'alchemyKey',
  'pimlico-key': 'pimlicoKey',
};

const VALID_KEYS = Object.keys(KEY_MAP);

function maskKey(value: string): string {
  if (value.length <= 6) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}

export function registerConfigCommand(program: Command, ctx: AppContext): void {
  const configCmd = program.command('config').description('Manage CLI configuration (API keys, RPC endpoints)');

  // ── show ───────────────────────────────────────────────────────
  configCmd
    .command('show')
    .description('Show current endpoint configuration')
    .action(() => {
      const keys = ctx.chain.getUserKeys();
      const chain = ctx.chain.currentChain;

      outputSuccess({
        rpcProvider: keys.alchemyKey ? 'alchemy' : 'public',
        bundlerProvider: keys.pimlicoKey ? 'pimlico' : 'public',
        alchemyKey: keys.alchemyKey ? maskKey(keys.alchemyKey) : null,
        pimlicoKey: keys.pimlicoKey ? maskKey(keys.pimlicoKey) : null,
        currentChain: {
          id: chain.id,
          name: chain.name,
          rpcEndpoint: display.maskApiKeys(chain.endpoint),
          bundler: display.maskApiKeys(chain.bundler),
        },
      });
    });

  // ── set ────────────────────────────────────────────────────────
  configCmd
    .command('set <key> <value>')
    .description(`Set an API key (${VALID_KEYS.join(' | ')})`)
    .action(async (key: string, value: string) => {
      const mapped = KEY_MAP[key];
      if (!mapped) {
        outputError(ErrorCode.INVALID_PARAMS, `Unknown key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`, {
          key,
          validKeys: VALID_KEYS,
        });
        return;
      }

      await ctx.chain.setUserKey(mapped, value);

      const chain = ctx.chain.currentChain;
      outputSuccess({
        status: 'saved',
        key,
        rpcEndpoint: display.maskApiKeys(chain.endpoint),
        bundler: display.maskApiKeys(chain.bundler),
      });
    });

  // ── remove ─────────────────────────────────────────────────────
  configCmd
    .command('remove <key>')
    .description(`Remove an API key and revert to public endpoint (${VALID_KEYS.join(' | ')})`)
    .action(async (key: string) => {
      const mapped = KEY_MAP[key];
      if (!mapped) {
        outputError(ErrorCode.INVALID_PARAMS, `Unknown key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`, {
          key,
          validKeys: VALID_KEYS,
        });
        return;
      }

      await ctx.chain.removeUserKey(mapped);

      outputSuccess({
        status: 'removed',
        key,
        hint: 'Reverted to public endpoint.',
      });
    });
}
