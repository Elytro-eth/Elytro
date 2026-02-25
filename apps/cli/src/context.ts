import { FileStore } from './storage';
import { KeyringService, ChainService, SDKService, WalletClientService, AccountService } from './services';
import { loadDeviceKey } from './utils/deviceKey';

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
  /** Device key loaded from disk. null if not yet initialized. */
  deviceKey: Uint8Array | null;
}

/**
 * Bootstrap all services and return the app context.
 * Called once at CLI startup.
 *
 * If a device key exists, the keyring is automatically unlocked.
 * Commands can assume keyring is ready when deviceKey is non-null.
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

  // Initialize chain-dependent services
  const currentChain = chain.currentChain;
  walletClient.initForChain(currentChain);
  await sdk.initForChain(currentChain);

  // Auto-load device key and unlock keyring
  const deviceKey = await loadDeviceKey(store.dataDir);
  if (deviceKey && (await keyring.isInitialized())) {
    await keyring.unlock(deviceKey);
  }

  const account = new AccountService({
    store,
    keyring,
    sdk,
    chain,
    walletClient,
  });
  await account.init();

  return { store, keyring, chain, sdk, walletClient, account, deviceKey };
}
