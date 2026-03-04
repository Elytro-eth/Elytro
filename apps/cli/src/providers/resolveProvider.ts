import type { SecretProvider } from './secretProvider';
import { KeychainProvider } from './keychainProvider';
import { EnvVarProvider } from './envVarProvider';

/**
 * Auto-detect the best available SecretProvider.
 *
 * Resolution order:
 *   1. macOS Keychain — primary, zero-interaction, persistent
 *   2. ELYTRO_VAULT_SECRET env var — fallback for Linux/container/CI
 *   3. null — no provider available
 *
 * Returns separate providers for init (store) and runtime (load):
 *   - initProvider: must support store() — only persistent providers
 *   - loadProvider: must support load() — any provider
 *
 * macOS Keychain always takes priority even if env var is set.
 * This prevents a rogue process from injecting ELYTRO_VAULT_SECRET
 * to override the Keychain-stored key on macOS.
 */
export async function resolveProvider(): Promise<{
  initProvider: SecretProvider | null;
  loadProvider: SecretProvider | null;
}> {
  const keychainProvider = new KeychainProvider();
  const envProvider = new EnvVarProvider();

  // Init (store): only persistent providers qualify
  const initProvider = (await keychainProvider.available()) ? keychainProvider : null;

  // Load: Keychain first (macOS source of truth), env var as fallback
  let loadProvider: SecretProvider | null = null;
  if (await keychainProvider.available()) {
    loadProvider = keychainProvider;
  } else if (await envProvider.available()) {
    loadProvider = envProvider;
  }

  return { initProvider, loadProvider };
}
