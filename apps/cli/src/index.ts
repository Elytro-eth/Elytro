import { Command } from 'commander';
import { createAppContext } from './context';
import { registerInitCommand } from './commands/init';
import { registerAccountCommand } from './commands/account';
import { registerTxCommand } from './commands/tx';
import * as display from './utils/display';

/**
 * Elytro CLI entry point.
 *
 * Architecture:
 *   1. Bootstrap the app context (all services, auto-unlock via device key)
 *   2. Register commands — each command receives the context
 *   3. Parse argv and execute
 *   4. Lock keyring on exit to clear keys from memory
 */

const program = new Command();

program.name('elytro').description('Elytro — ERC-4337 Smart Account Wallet CLI').version('0.0.1');

async function main(): Promise<void> {
  let ctx: Awaited<ReturnType<typeof createAppContext>> | null = null;
  try {
    ctx = await createAppContext();

    registerInitCommand(program, ctx);
    registerAccountCommand(program, ctx);
    registerTxCommand(program, ctx);

    // Phase 2: registerCallCommand(program, ctx);
    // Phase 3: registerRecoveryCommand(program, ctx);
    // Phase 3: registerHookCommand(program, ctx);

    await program.parseAsync(process.argv);
  } catch (err) {
    display.error((err as Error).message);
    process.exitCode = 1;
  } finally {
    // Clear decrypted keys from memory
    ctx?.keyring.lock();
  }
}

main();
