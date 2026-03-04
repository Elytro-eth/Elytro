import type { SecretProvider } from './secretProvider';

const ENV_KEY = 'ELYTRO_VAULT_SECRET';

/**
 * EnvVarProvider — reads vault key from ELYTRO_VAULT_SECRET env var.
 *
 * This is a **load-only** provider. It cannot store secrets (env vars
 * are ephemeral). Used as a fallback for non-macOS environments:
 *   - Linux containers / CI pipelines
 *   - OpenClaw SecretRef injection
 *   - Docker Secrets (via wrapper script)
 *
 * Security properties:
 *   - Consume-once: env var deleted from process.env after reading
 *   - Limitation: /proc/PID/environ on Linux retains the original value
 *     for the process lifetime (kernel-level, cannot be scrubbed)
 *
 * Expected format: base64-encoded 32-byte key
 *   e.g. ELYTRO_VAULT_SECRET="K7xP2mN9qR4vB8wF3jL..."
 */
export class EnvVarProvider implements SecretProvider {
  readonly name = 'env-var';

  async available(): Promise<boolean> {
    return !!process.env[ENV_KEY];
  }

  async store(_secret: Uint8Array): Promise<void> {
    // EnvVarProvider is read-only — cannot persist to env vars.
    // During `init`, if only this provider is available, the CLI
    // falls back to manual mode (display secret once).
    throw new Error(
      'EnvVarProvider is read-only. Cannot store vault key in an environment variable. ' +
        'Use a persistent provider (macOS Keychain) or store the secret manually.'
    );
  }

  async load(): Promise<Uint8Array | null> {
    const raw = process.env[ENV_KEY];
    if (!raw) return null;

    // Consume-once: scrub from process.env immediately
    delete process.env[ENV_KEY];

    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error(
        `${ENV_KEY} has invalid length: expected 32 bytes (base64), got ${key.length}. ` +
          'The value must be a base64-encoded 256-bit key.'
      );
    }
    return new Uint8Array(key);
  }

  async delete(): Promise<void> {
    delete process.env[ENV_KEY];
  }
}
