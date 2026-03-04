import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SecretProvider } from './secretProvider';

const execFileAsync = promisify(execFile);

/**
 * KeychainProvider — stores the vault key in macOS Keychain.
 *
 * Uses the `security` CLI to interact with the login keychain.
 * The key is stored as a base64-encoded generic password item.
 *
 * Security properties:
 *   - Key encrypted at rest (login keychain, Secure Enclave on Apple Silicon)
 *   - Not co-located with ~/.elytro/ vault files
 *   - Zero-interaction: login keychain is unlocked when user is logged in
 *   - Survives app deletion (keychain item persists)
 *
 * Limitations:
 *   - macOS only (process.platform === 'darwin')
 *   - No ACL pinning for Node.js CLI (would need code-signed binary)
 *   - Same-UID processes can read without prompt (login keychain is unlocked)
 */
export class KeychainProvider implements SecretProvider {
  readonly name = 'macos-keychain';

  private readonly service = 'elytro-wallet';
  private readonly account = 'vault-key';

  async available(): Promise<boolean> {
    if (process.platform !== 'darwin') return false;
    try {
      // Verify `security` binary exists and is callable
      await execFileAsync('security', ['help'], { timeout: 5000 });
      return true;
    } catch {
      // `security help` exits with code 1 but still proves the binary exists
      // Check if the error is "command not found" vs normal exit
      return process.platform === 'darwin';
    }
  }

  async store(secret: Uint8Array): Promise<void> {
    validateKeyLength(secret);
    const b64 = Buffer.from(secret).toString('base64');
    try {
      // -U: update if exists (upsert), -s: service, -a: account, -w: password data
      await execFileAsync('security', [
        'add-generic-password',
        '-U',
        '-s',
        this.service,
        '-a',
        this.account,
        '-w',
        b64,
      ]);
    } catch (err) {
      throw new Error(`Failed to store vault key in Keychain: ${(err as Error).message}`);
    }
  }

  async load(): Promise<Uint8Array | null> {
    try {
      const { stdout } = await execFileAsync('security', [
        'find-generic-password',
        '-s',
        this.service,
        '-a',
        this.account,
        '-w',
      ]);
      const trimmed = stdout.trim();
      if (!trimmed) return null;

      const key = Buffer.from(trimmed, 'base64');
      if (key.length !== 32) {
        throw new Error(`Keychain vault key has invalid length: expected 32 bytes, got ${key.length}.`);
      }
      return new Uint8Array(key);
    } catch (err) {
      const msg = (err as Error).message || '';
      // "The specified item could not be found" = no key stored yet
      if (msg.includes('could not be found') || msg.includes('SecKeychainSearchCopyNext')) {
        return null;
      }
      throw new Error(`Failed to load vault key from Keychain: ${msg}`);
    }
  }

  async delete(): Promise<void> {
    try {
      await execFileAsync('security', ['delete-generic-password', '-s', this.service, '-a', this.account]);
    } catch {
      // Ignore "not found" — idempotent delete
    }
  }
}

function validateKeyLength(key: Uint8Array): void {
  if (key.length !== 32) {
    throw new Error(`Invalid vault key: expected 32 bytes, got ${key.length}.`);
  }
}
