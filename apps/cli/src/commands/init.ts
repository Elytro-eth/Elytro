import { webcrypto } from 'node:crypto';
import { Command } from 'commander';
import ora from 'ora';
import type { AppContext } from '../context';
import { resolveProvider } from '../providers';
import * as display from '../utils/display';
import { outputSuccess, outputError, ErrorCode, isJsonMode } from '../utils/output';

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
        outputSuccess({
          status: 'already_initialized',
          dataDir: ctx.store.dataDir,
          hint: 'Use `elytro account create` to create a smart account.',
        });
        return;
      }

      if (!isJsonMode()) display.heading('Initialize Elytro Wallet');

      const spinner = isJsonMode() ? null : ora('Setting up wallet...').start();
      try {
        // 1. Generate a cryptographically secure 256-bit vault key
        const vaultKey = webcrypto.getRandomValues(new Uint8Array(32));

        // 2. Resolve the init provider (persistent storage)
        const { initProvider } = await resolveProvider();

        let secretProviderName: string;
        let manualSecret: string | null = null;

        if (initProvider) {
          // Persistent provider available (e.g. macOS Keychain)
          await initProvider.store(vaultKey);
          if (spinner) spinner.text = `Vault key stored in ${initProvider.name}.`;
          secretProviderName = initProvider.name;
        } else {
          // No persistent provider — display secret for manual storage
          if (spinner) spinner.stop();
          const b64 = Buffer.from(vaultKey).toString('base64');
          manualSecret = b64;
          secretProviderName = 'manual';

          if (!isJsonMode()) {
            console.log('');
            display.warn('No persistent secret provider available (not on macOS).');
            display.warn('Save the following vault secret — it will NOT be shown again:');
            console.log('');
            console.log(`  ELYTRO_VAULT_SECRET="${b64}"`);
            console.log('');
            display.info('Hint', 'Set this environment variable before running any elytro command.');
          }
          if (spinner) spinner.start('Creating wallet...');
        }

        // 3. Create the encrypted vault with the new key
        await ctx.keyring.createNewOwner(vaultKey);

        // Zero-fill the key buffer after use
        vaultKey.fill(0);

        if (spinner) spinner.succeed('Wallet initialized.');

        outputSuccess({
          status: 'initialized',
          dataDir: ctx.store.dataDir,
          secretProvider: secretProviderName,
          ...(manualSecret ? { vaultSecret: manualSecret } : {}),
          hint: 'Run `elytro account create --chain <chainId>` to create your first smart account.',
        });
      } catch (err) {
        if (spinner) spinner.fail('Failed to initialize wallet.');
        outputError(ErrorCode.INTERNAL, display.sanitizeErrorMessage((err as Error).message));
      }
    });
}
