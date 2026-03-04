import { webcrypto } from 'node:crypto';
import { Command } from 'commander';
import ora from 'ora';
import type { AppContext } from '../context';
import { resolveProvider } from '../providers';
import * as display from '../utils/display';
import { sanitizeErrorMessage } from '../utils/display';

/**
 * `elytro init` — Initialize a new wallet.
 *
 * Generates a 256-bit vault key and an EOA signing key.
 *
 * Key storage (auto-detected):
 *   - macOS: stored in Keychain (zero-interaction, encrypted at rest)
 *   - Other: displayed once for manual storage, injected via ELYTRO_VAULT_SECRET
 *
 * No password required — key management is handled by the SecretProvider.
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
        // 1. Generate a cryptographically secure 256-bit vault key
        const vaultKey = webcrypto.getRandomValues(new Uint8Array(32));

        // 2. Resolve the init provider (persistent storage)
        const { initProvider } = await resolveProvider();

        if (initProvider) {
          // Persistent provider available (e.g. macOS Keychain)
          await initProvider.store(vaultKey);
          spinner.text = `Vault key stored in ${initProvider.name}.`;
        } else {
          // No persistent provider — display secret for manual storage
          spinner.stop();
          const b64 = Buffer.from(vaultKey).toString('base64');
          console.log('');
          display.warn('No persistent secret provider available (not on macOS).');
          display.warn('Save the following vault secret — it will NOT be shown again:');
          console.log('');
          console.log(`  ELYTRO_VAULT_SECRET="${b64}"`);
          console.log('');
          display.info('Hint', 'Set this environment variable before running any elytro command.');
          spinner.start('Creating wallet...');
        }

        // 3. Create the encrypted vault with the new key
        await ctx.keyring.createNewOwner(vaultKey);

        // Zero-fill the key buffer after use
        vaultKey.fill(0);

        spinner.succeed('Wallet initialized.');

        console.log('');
        display.info('Data', ctx.store.dataDir);
        if (initProvider) {
          display.info('Secret Provider', initProvider.name);
        }
        console.log('');
        display.success('Run `elytro account create --chain <chainId>` to create your first smart account.');
      } catch (err) {
        spinner.fail('Failed to initialize wallet.');
        display.error(sanitizeErrorMessage((err as Error).message));
        process.exitCode = 1;
      }
    });
}
