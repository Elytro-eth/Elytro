import { Command } from 'commander';
import type { AppContext } from '../context';
import type { UserKeys } from '../types';
import * as display from '../utils/display';

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
      display.heading('Configuration');

      const keys = ctx.chain.getUserKeys();
      const hasAlchemy = !!keys.alchemyKey;
      const hasPimlico = !!keys.pimlicoKey;

      display.info('RPC provider', hasAlchemy ? 'Alchemy (user-configured)' : 'Public (publicnode.com)');
      display.info('Bundler provider', hasPimlico ? 'Pimlico (user-configured)' : 'Public (pimlico.io/public)');

      if (keys.alchemyKey) {
        display.info('Alchemy key', maskKey(keys.alchemyKey));
      }
      if (keys.pimlicoKey) {
        display.info('Pimlico key', maskKey(keys.pimlicoKey));
      }

      console.log('');
      const chain = ctx.chain.currentChain;
      display.info('Current chain', `${chain.name} (${chain.id})`);
      display.info('RPC endpoint', display.maskApiKeys(chain.endpoint));
      display.info('Bundler', display.maskApiKeys(chain.bundler));

      if (!hasAlchemy || !hasPimlico) {
        console.log('');
        display.warn('Public endpoints have rate limits. Set your own keys for production use:');
        if (!hasAlchemy) console.log('  elytro config set alchemy-key <YOUR_KEY>');
        if (!hasPimlico) console.log('  elytro config set pimlico-key <YOUR_KEY>');
      }
    });

  // ── set ────────────────────────────────────────────────────────
  configCmd
    .command('set <key> <value>')
    .description(`Set an API key (${VALID_KEYS.join(' | ')})`)
    .action(async (key: string, value: string) => {
      const mapped = KEY_MAP[key];
      if (!mapped) {
        display.error(`Unknown key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exitCode = 1;
        return;
      }

      await ctx.chain.setUserKey(mapped, value);
      display.success(`${key} saved. Endpoints updated.`);

      // Show the new endpoint for current chain
      const chain = ctx.chain.currentChain;
      display.info('RPC endpoint', display.maskApiKeys(chain.endpoint));
      display.info('Bundler', display.maskApiKeys(chain.bundler));
    });

  // ── remove ─────────────────────────────────────────────────────
  configCmd
    .command('remove <key>')
    .description(`Remove an API key and revert to public endpoint (${VALID_KEYS.join(' | ')})`)
    .action(async (key: string) => {
      const mapped = KEY_MAP[key];
      if (!mapped) {
        display.error(`Unknown key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exitCode = 1;
        return;
      }

      await ctx.chain.removeUserKey(mapped);
      display.success(`${key} removed. Reverted to public endpoint.`);
    });
}
