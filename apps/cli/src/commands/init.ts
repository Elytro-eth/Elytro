import { Command } from 'commander';
import ora from 'ora';
import type { AppContext } from '../context';
import { generateDeviceKey, saveDeviceKey } from '../utils/deviceKey';
import * as display from '../utils/display';

/**
 * `elytro init` — Initialize a new wallet.
 *
 * Generates a device key and a signing key.
 * No password required — the device key on disk is the access control.
 */
export function registerInitCommand(program: Command, ctx: AppContext): void {
  program
    .command('init')
    .description('Initialize a new Elytro wallet')
    .action(async () => {
      if (await ctx.keyring.isInitialized()) {
        display.warn('Wallet already initialized.');
        display.info('Data', ctx.store.dataDir);
        display.info('Hint', 'Use `elytro account create` to create a smart account.');
        return;
      }

      display.heading('Initialize Elytro Wallet');

      const spinner = ora('Setting up wallet...').start();
      try {
        const deviceKey = generateDeviceKey();
        await saveDeviceKey(ctx.store.dataDir, deviceKey);
        await ctx.keyring.createNewOwner(deviceKey);

        // Store deviceKey in context for subsequent commands in the same session
        (ctx as { deviceKey: Uint8Array | null }).deviceKey = deviceKey;

        spinner.succeed('Wallet initialized.');

        console.log('');
        display.info('Data', ctx.store.dataDir);
        console.log('');
        display.success('Run `elytro account create --chain <chainId>` to create your first smart account.');
      } catch (err) {
        spinner.fail('Failed to initialize wallet.');
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });
}
