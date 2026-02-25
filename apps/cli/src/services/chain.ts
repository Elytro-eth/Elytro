import type { StorageAdapter, ChainConfig, CliConfig } from '../types';
import { getDefaultConfig } from '../utils/config';

const STORAGE_KEY = 'config';

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
 */
export class ChainService {
  private store: StorageAdapter;
  private config: CliConfig;

  constructor(store: StorageAdapter) {
    this.store = store;
    this.config = getDefaultConfig();
  }

  /** Load persisted config or use defaults. */
  async init(): Promise<void> {
    const saved = await this.store.load<CliConfig>(STORAGE_KEY);
    if (saved) {
      this.config = { ...getDefaultConfig(), ...saved };
    }
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
