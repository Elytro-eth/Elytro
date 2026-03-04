/**
 * SecretProvider — pluggable interface for vault key storage.
 *
 * The vault key (256-bit AES key) must be stored outside ~/.elytro/
 * to achieve domain separation: the encrypted vault and the key that
 * decrypts it live in different security domains.
 *
 * Resolution order (macOS-first):
 *   1. macOS Keychain (KeychainProvider)  — primary, zero-interaction
 *   2. ELYTRO_VAULT_SECRET env var (EnvVarProvider) — fallback for Linux/container/CI
 *   3. Error: no provider available
 *
 * Built now:
 *   - KeychainProvider (macOS `security` CLI)
 *   - EnvVarProvider (load-only, for runtime injection)
 *
 * Future extension points (add class + one branch in resolveProvider):
 *   - LinuxSecretServiceProvider (libsecret / GNOME Keyring)
 *   - OpenClawApiProvider (SecretRef API for headless agent init)
 *   - FileProvider (tmpfs-mounted file, Docker Secrets)
 */

export interface SecretProvider {
  /** Human-readable provider name for display. */
  readonly name: string;

  /** Can this provider function in the current environment? */
  available(): Promise<boolean>;

  /**
   * Store a secret. Called once during `elytro init`.
   * Provider decides the storage mechanism (Keychain, API, etc.).
   */
  store(secret: Uint8Array): Promise<void>;

  /**
   * Load the secret. Called on every CLI invocation.
   * Returns null if no secret is stored (wallet not initialized).
   */
  load(): Promise<Uint8Array | null>;

  /**
   * Delete the stored secret. Called during `elytro reset` or key rotation.
   */
  delete(): Promise<void>;
}
