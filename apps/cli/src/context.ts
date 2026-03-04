import { FileStore } from './storage';
import { KeyringService, ChainService, SDKService, WalletClientService, AccountService } from './services';
import { resolveProvider } from './providers';
import type { SecretProvider } from './providers';

/**
 * Application context — the service container.
 *
 * Extension uses singletons + eventBus for inter-service wiring.
 * CLI uses explicit dependency injection via this context object.
 * All commands receive the context and pick the services they need.
 */
export interface AppContext {
  store: FileStore;
  keyring: KeyringService;
  chain: ChainService;
  sdk: SDKService;
  walletClient: WalletClientService;
  account: AccountService;
  /**
   * The resolved provider for storing/loading the vault key.
   * null if no provider was available at boot (init not yet run, or unsupported platform).
   */
  secretProvider: SecretProvider | null;
}

/**
 * Bootstrap all services and return the app context.
 * Called once at CLI startup.
 *
 * If a vault key can be loaded (from Keychain or env var),
 * the keyring is automatically unlocked.
 * Commands can check keyring.isUnlocked to verify readiness.
 */
export async function createAppContext(): Promise<AppContext> {
  const store = new FileStore();
  await store.init();

  const keyring = new KeyringService(store);
  const chain = new ChainService(store);
  const sdk = new SDKService();
  const walletClient = new WalletClientService();

  // Load persisted chain config
  await chain.init();

  // Initialize chain-dependent services with config default first
  const defaultChain = chain.currentChain;
  walletClient.initForChain(defaultChain);
  await sdk.initForChain(defaultChain);

  // Resolve secret provider (macOS Keychain > env var > null)
  const { loadProvider } = await resolveProvider();

  // Auto-load vault key and unlock keyring
  if (loadProvider && (await keyring.isInitialized())) {
    const vaultKey = await loadProvider.load();
    if (vaultKey) {
      await keyring.unlock(vaultKey);
      // Zero-fill the key buffer after use
      vaultKey.fill(0);
    }
  }

  const account = new AccountService({
    store,
    keyring,
    sdk,
    chain,
    walletClient,
  });
  await account.init();

  // Re-initialize chain-dependent services to match the current account's chain.
  // The config default (e.g. OP Sepolia) may differ from the account's actual chain.
  const currentAccount = account.currentAccount;
  if (currentAccount) {
    const acctInfo = account.resolveAccount(currentAccount.alias ?? currentAccount.address);
    if (acctInfo) {
      const acctChain = chain.chains.find((c) => c.id === acctInfo.chainId);
      if (acctChain && acctChain.id !== defaultChain.id) {
        walletClient.initForChain(acctChain);
        await sdk.initForChain(acctChain);
      }
    }
  }

  return { store, keyring, chain, sdk, walletClient, account, secretProvider: loadProvider };
}
