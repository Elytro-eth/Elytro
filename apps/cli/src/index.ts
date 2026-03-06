import { Command } from 'commander';
import { createAppContext } from './context';
import { registerInitCommand } from './commands/init';
import { registerAccountCommand } from './commands/account';
import { registerTxCommand } from './commands/tx';
import { registerQueryCommand } from './commands/query';
import { registerSecurityCommand } from './commands/security';
import { registerConfigCommand } from './commands/config';
import { registerRecoveryCommand } from './commands/recovery';
import { setJsonMode, outputError, ErrorCode } from './utils/output';
import { sanitizeErrorMessage } from './utils/display';

/**
 * Elytro CLI entry point.
 *
 * Architecture:
 *   1. Bootstrap the app context (all services, auto-unlock via device key)
 *   2. Register commands — each command receives the context
 *   3. Parse argv and execute
 *   4. Lock keyring on exit to clear keys from memory
 *
 * Global flags:
 *   --json   Output structured JSON only (no spinners, no human-readable text).
 *            Designed for MCP tool integration and AI agent consumption.
 */

const program = new Command();

program
  .name('elytro')
  .description('Elytro — ERC-4337 Smart Account Wallet CLI')
  .version('0.0.1')
  .option('--json', 'Output structured JSON only (for MCP / AI agent integration)')
  .hook('preAction', (thisCommand) => {
    // Resolve --json from the root command, regardless of which subcommand runs
    const rootOpts = thisCommand.opts();
    if (rootOpts.json) {
      setJsonMode(true);
    }
  });

async function main(): Promise<void> {
  let ctx: Awaited<ReturnType<typeof createAppContext>> | null = null;
  try {
    ctx = await createAppContext();

    registerInitCommand(program, ctx);
    registerAccountCommand(program, ctx);
    registerTxCommand(program, ctx);
    registerQueryCommand(program, ctx);
    registerSecurityCommand(program, ctx);
    registerConfigCommand(program, ctx);
    registerRecoveryCommand(program, ctx);

    // Phase 4: registerCallCommand(program, ctx);

    await program.parseAsync(process.argv);
  } catch (err) {
    outputError(ErrorCode.INTERNAL, sanitizeErrorMessage((err as Error).message));
  } finally {
    // Clear decrypted keys from memory
    ctx?.keyring.lock();
  }
}

main();
