import type { StorageAdapter, ChainConfig, CliConfig, UserKeys } from '../types';
import { getDefaultConfig, buildChains } from '../utils/config';

const STORAGE_KEY = 'config';
const USER_KEYS_KEY = 'user-keys';

/**
 * ChainService — multi-chain configuration management.
 *
 * Business intent (from extension's ChainService):
 * - Maintain a list of supported chains with RPC / bundler endpoints
 * - Track the currently selected chain
 * - Allow switching and custom chain addition
 *
 * CLI differences:
 * - No reactive store / eventBus — single-process, imperative
 * - Config persisted as a single JSON file
 * - No version-migration logic (fresh start for CLI)
 *
 * API keys:
 * - Stored separately in user-keys.json (never in config.json)
 * - Resolved at init: userKeys > env vars > public fallback
 */
export class ChainService {
  private store: StorageAdapter;
  private config: CliConfig;
  private userKeys: UserKeys = {};

  constructor(store: StorageAdapter) {
    this.store = store;
    this.config = getDefaultConfig();
  }

  /** Load persisted config and user keys, rebuild chain endpoints. */
  async init(): Promise<void> {
    // Load user keys first — they affect chain endpoint resolution
    this.userKeys = (await this.store.load<UserKeys>(USER_KEYS_KEY)) ?? {};

    const saved = await this.store.load<CliConfig>(STORAGE_KEY);
    if (saved) {
      this.config = { ...getDefaultConfig(), ...saved };
    }

    // Always rebuild chain endpoints with current key resolution
    this.config.chains = buildChains(this.userKeys.alchemyKey, this.userKeys.pimlicoKey);
  }

  // ─── User Keys ──────────────────────────────────────────────────

  /** Get current user keys (for display — values are masked). */
  getUserKeys(): UserKeys {
    return { ...this.userKeys };
  }

  /** Set a user API key and rebuild chain endpoints. */
  async setUserKey(key: keyof UserKeys, value: string): Promise<void> {
    this.userKeys[key] = value;
    await this.store.save(USER_KEYS_KEY, this.userKeys);
    this.config.chains = buildChains(this.userKeys.alchemyKey, this.userKeys.pimlicoKey);
  }

  /** Remove a user API key and fall back to env / public endpoints. */
  async removeUserKey(key: keyof UserKeys): Promise<void> {
    delete this.userKeys[key];
    await this.store.save(USER_KEYS_KEY, this.userKeys);
    this.config.chains = buildChains(this.userKeys.alchemyKey, this.userKeys.pimlicoKey);
  }

  // ─── Getters ────────────────────────────────────────────────────

  get currentChain(): ChainConfig {
    const chain = this.config.chains.find((c) => c.id === this.config.currentChainId);
    if (!chain) {
      throw new Error(`Chain ${this.config.currentChainId} not found in config.`);
    }
    return chain;
  }

  get currentChainId(): number {
    return this.config.currentChainId;
  }

  get chains(): ChainConfig[] {
    return this.config.chains;
  }

  get graphqlEndpoint(): string {
    return this.config.graphqlEndpoint;
  }

  get fullConfig(): CliConfig {
    return { ...this.config };
  }

  // ─── Mutations ──────────────────────────────────────────────────

  async switchChain(chainId: number): Promise<ChainConfig> {
    const chain = this.config.chains.find((c) => c.id === chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} is not configured.`);
    }
    this.config.currentChainId = chainId;
    await this.persist();
    return chain;
  }

  async addChain(chain: ChainConfig): Promise<void> {
    if (this.config.chains.some((c) => c.id === chain.id)) {
      throw new Error(`Chain ${chain.id} already exists.`);
    }
    this.config.chains.push(chain);
    await this.persist();
  }

  async removeChain(chainId: number): Promise<void> {
    if (chainId === this.config.currentChainId) {
      throw new Error('Cannot remove the currently selected chain.');
    }
    this.config.chains = this.config.chains.filter((c) => c.id !== chainId);
    await this.persist();
  }

  // ─── Internal ───────────────────────────────────────────────────

  private async persist(): Promise<void> {
    await this.store.save(STORAGE_KEY, this.config);
  }
}
