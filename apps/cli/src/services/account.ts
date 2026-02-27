import type { Address } from 'viem';
import type { StorageAdapter, AccountInfo } from '../types';
import type { KeyringService } from './keyring';
import type { SDKService } from './sdk';
import type { ChainService } from './chain';
import type { WalletClientService } from './walletClient';
import { generateAlias } from '../utils/alias';

const STORAGE_KEY = 'accounts';

interface AccountsState {
  accounts: AccountInfo[];
  currentAddress: Address | null;
}

/**
 * AccountService — smart account lifecycle management.
 *
 * Business intent (from extension's AccountManager):
 * - Create smart account addresses via SDK (counterfactual)
 * - Maintain a registry of accounts across chains
 * - Track current account selection
 * - Query on-chain deployment status and balance
 *
 * CLI design decisions:
 * - Owner (EOA) is an internal detail, never surfaced to users
 * - Each account has a human-readable alias (e.g. "swift-panda")
 * - Chain is required at creation time (no implicit default)
 * - Multiple accounts per chain are supported via CREATE2 index
 * - Accounts can be referenced by alias or address in commands
 */
export class AccountService {
  private store: StorageAdapter;
  private keyring: KeyringService;
  private sdk: SDKService;
  private chain: ChainService;
  private walletClient: WalletClientService;
  private state: AccountsState = { accounts: [], currentAddress: null };

  constructor(deps: {
    store: StorageAdapter;
    keyring: KeyringService;
    sdk: SDKService;
    chain: ChainService;
    walletClient: WalletClientService;
  }) {
    this.store = deps.store;
    this.keyring = deps.keyring;
    this.sdk = deps.sdk;
    this.chain = deps.chain;
    this.walletClient = deps.walletClient;
  }

  /** Load persisted accounts from disk. */
  async init(): Promise<void> {
    const saved = await this.store.load<AccountsState>(STORAGE_KEY);
    if (saved) {
      this.state = saved;
    }
  }

  // ─── Create ─────────────────────────────────────────────────────

  /**
   * Create a new smart account on the specified chain.
   *
   * Multiple accounts per chain are allowed — each gets a unique
   * CREATE2 index, producing a different contract address.
   *
   * @param chainId - Required. The target chain.
   * @param alias   - Optional. Human-readable name. Auto-generated if omitted.
   */
  async createAccount(chainId: number, alias?: string): Promise<AccountInfo> {
    const owner = this.keyring.currentOwner;
    if (!owner) {
      throw new Error('Keyring is locked. Unlock first.');
    }

    // Resolve alias: use provided, or generate a unique one
    const finalAlias = alias ?? this.uniqueAlias();

    // Check alias uniqueness
    if (this.state.accounts.some((a) => a.alias === finalAlias)) {
      throw new Error(`Alias "${finalAlias}" is already taken.`);
    }

    // Determine next CREATE2 index for this owner+chain
    const index = this.nextIndex(owner, chainId);

    // Calculate counterfactual address with index
    const address = await this.sdk.calcWalletAddress(owner, chainId, index);

    const account: AccountInfo = {
      address,
      chainId,
      alias: finalAlias,
      owner,
      index,
      isDeployed: false,
      isRecoveryEnabled: false,
    };

    this.state.accounts.push(account);
    this.state.currentAddress = address;
    await this.persist();

    return account;
  }

  // ─── Query ──────────────────────────────────────────────────────

  get currentAccount(): AccountInfo | null {
    if (!this.state.currentAddress) return null;
    return this.state.accounts.find((a) => a.address === this.state.currentAddress) ?? null;
  }

  get allAccounts(): AccountInfo[] {
    return [...this.state.accounts];
  }

  getAccountsByChain(chainId: number): AccountInfo[] {
    return this.state.accounts.filter((a) => a.chainId === chainId);
  }

  /**
   * Resolve an account by alias or address (case-insensitive).
   * This is the primary lookup method for commands.
   */
  resolveAccount(aliasOrAddress: string): AccountInfo | null {
    const needle = aliasOrAddress.toLowerCase();
    return (
      this.state.accounts.find((a) => a.alias.toLowerCase() === needle || a.address.toLowerCase() === needle) ?? null
    );
  }

  // ─── Switch ─────────────────────────────────────────────────────

  async switchAccount(aliasOrAddress: string): Promise<AccountInfo> {
    const account = this.resolveAccount(aliasOrAddress);
    if (!account) {
      throw new Error(`Account "${aliasOrAddress}" not found.`);
    }
    this.state.currentAddress = account.address;
    await this.persist();
    return account;
  }

  // ─── Activation ───────────────────────────────────────────────────

  /**
   * Mark an account as deployed on-chain.
   * Called after successful UserOp receipt confirms deployment.
   */
  async markDeployed(address: Address, chainId: number): Promise<void> {
    const account = this.state.accounts.find(
      (a) => a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
    );
    if (!account) {
      throw new Error(`Account ${address} on chain ${chainId} not found.`);
    }
    account.isDeployed = true;
    await this.persist();
  }

  // ─── On-chain info ──────────────────────────────────────────────

  async getAccountDetail(aliasOrAddress: string): Promise<
    AccountInfo & {
      balance: string;
    }
  > {
    const account = this.resolveAccount(aliasOrAddress);
    if (!account) {
      throw new Error(`Account "${aliasOrAddress}" not found.`);
    }

    const [isDeployed, { ether: balance }] = await Promise.all([
      this.walletClient.isContractDeployed(account.address),
      this.walletClient.getBalance(account.address),
    ]);

    // Sync local state if on-chain status changed
    if (isDeployed && !account.isDeployed) {
      account.isDeployed = true;
      await this.persist();
    }

    return {
      ...account,
      isDeployed,
      balance,
    };
  }

  // ─── Import / Export ────────────────────────────────────────────

  async importAccounts(accounts: AccountInfo[]): Promise<number> {
    let imported = 0;
    for (const account of accounts) {
      const exists = this.state.accounts.some(
        (a) => a.address.toLowerCase() === account.address.toLowerCase() && a.chainId === account.chainId
      );
      if (!exists) {
        this.state.accounts.push(account);
        imported++;
      }
    }
    if (imported > 0) {
      await this.persist();
    }
    return imported;
  }

  // ─── Internal ───────────────────────────────────────────────────

  /**
   * Get the next available CREATE2 index for a given owner+chain.
   * Simply counts how many accounts this owner already has on this chain.
   */
  private nextIndex(owner: Address, chainId: number): number {
    return this.state.accounts.filter((a) => a.owner.toLowerCase() === owner.toLowerCase() && a.chainId === chainId)
      .length;
  }

  /** Generate an alias that doesn't collide with existing ones. */
  private uniqueAlias(): string {
    const existing = new Set(this.state.accounts.map((a) => a.alias));
    for (let i = 0; i < 100; i++) {
      const candidate = generateAlias();
      if (!existing.has(candidate)) return candidate;
    }
    // Extremely unlikely fallback
    return `account-${this.state.accounts.length + 1}`;
  }

  private async persist(): Promise<void> {
    await this.store.save(STORAGE_KEY, this.state);
  }
}
