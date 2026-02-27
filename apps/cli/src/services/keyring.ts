import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex } from 'viem';
import { encryptWithKey, decryptWithKey, encrypt, decrypt } from '../utils/passworder';
import type { StorageAdapter, VaultData, OwnerKey, EncryptedData } from '../types';

const STORAGE_KEY = 'keyring';

/**
 * KeyringService — EOA private key management.
 *
 * All routine operations use a device key (256-bit raw key from file).
 * Password-based encryption is only used for export/import (backup).
 *
 * Lifecycle:
 *   init  → createNewOwner(deviceKey) → vault encrypted with device key
 *   boot  → unlock(deviceKey) automatically by context
 *   use   → signMessage / getAccount (vault already in memory)
 *   exit  → lock() clears vault from memory
 *   export → exportVault(password) re-encrypts with user password
 *   import → importVault(encrypted, password, deviceKey) decrypts then re-encrypts
 */
export class KeyringService {
  private store: StorageAdapter;
  private vault: VaultData | null = null;

  constructor(store: StorageAdapter) {
    this.store = store;
  }

  // ─── Initialization ─────────────────────────────────────────────

  /** Check if a vault (encrypted keyring) already exists on disk. */
  async isInitialized(): Promise<boolean> {
    return this.store.exists(STORAGE_KEY);
  }

  /**
   * Create a brand-new vault with one owner.
   * Called during `elytro init`. Encrypts with device key.
   */
  async createNewOwner(deviceKey: Uint8Array): Promise<Address> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const owner: OwnerKey = { id: account.address, key: privateKey };
    const vault: VaultData = {
      owners: [owner],
      currentOwnerId: account.address,
    };

    const encrypted = await encryptWithKey(deviceKey, vault);
    await this.store.save(STORAGE_KEY, encrypted);

    this.vault = vault;
    return account.address;
  }

  // ─── Unlock / Access ────────────────────────────────────────────

  /**
   * Decrypt the vault with the device key.
   * Called automatically by context at CLI startup.
   */
  async unlock(deviceKey: Uint8Array): Promise<void> {
    const encrypted = await this.store.load<EncryptedData>(STORAGE_KEY);
    if (!encrypted) {
      throw new Error('Keyring not initialized. Run `elytro init` first.');
    }
    this.vault = await decryptWithKey<VaultData>(deviceKey, encrypted);
  }

  /** Lock the vault, clearing decrypted keys from memory. */
  lock(): void {
    this.vault = null;
  }

  get isUnlocked(): boolean {
    return this.vault !== null;
  }

  // ─── Current owner ──────────────────────────────────────────────

  get currentOwner(): Address | null {
    return (this.vault?.currentOwnerId as Address) ?? null;
  }

  get owners(): Address[] {
    return this.vault?.owners.map((o) => o.id) ?? [];
  }

  // ─── Signing ────────────────────────────────────────────────────

  async signMessage(message: Hex): Promise<Hex> {
    const key = this.getCurrentKey();
    const account = privateKeyToAccount(key);
    return account.signMessage({ message: { raw: message } });
  }

  /**
   * Raw ECDSA sign over a 32-byte digest (no EIP-191 prefix).
   *
   * Equivalent to extension's `ethers.SigningKey.signDigest()`.
   * Used for ERC-4337 UserOperation signing where the hash is
   * already computed by the SDK (userOpHash → packRawHash).
   */
  async signDigest(digest: Hex): Promise<Hex> {
    const key = this.getCurrentKey();
    const account = privateKeyToAccount(key);
    return account.sign({ hash: digest });
  }

  /**
   * Get a viem LocalAccount for the current owner.
   * Useful for SDK operations that need a signer.
   */
  getAccount() {
    const key = this.getCurrentKey();
    return privateKeyToAccount(key);
  }

  // ─── Multi-owner management ─────────────────────────────────────

  async addOwner(deviceKey: Uint8Array): Promise<Address> {
    this.ensureUnlocked();

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    this.vault!.owners.push({ id: account.address, key: privateKey });
    await this.persistVault(deviceKey);
    return account.address;
  }

  async switchOwner(ownerId: Address, deviceKey: Uint8Array): Promise<void> {
    this.ensureUnlocked();

    const exists = this.vault!.owners.some((o) => o.id === ownerId);
    if (!exists) {
      throw new Error(`Owner ${ownerId} not found in vault.`);
    }

    this.vault!.currentOwnerId = ownerId;
    await this.persistVault(deviceKey);
  }

  // ─── Export / Import (password-based for portability) ───────────

  /**
   * Export vault encrypted with a user-provided password.
   * The output can be imported on another device.
   */
  async exportVault(password: string): Promise<EncryptedData> {
    this.ensureUnlocked();
    return encrypt(password, this.vault!);
  }

  /**
   * Import vault from a password-encrypted backup.
   * Decrypts with the backup password, then re-encrypts with device key.
   */
  async importVault(encrypted: EncryptedData, password: string, deviceKey: Uint8Array): Promise<void> {
    const vault = await decrypt<VaultData>(password, encrypted);
    this.vault = vault;
    const reEncrypted = await encryptWithKey(deviceKey, vault);
    await this.store.save(STORAGE_KEY, reEncrypted);
  }

  // ─── Rekey (device key rotation) ───────────────────────────────

  async rekey(newDeviceKey: Uint8Array): Promise<void> {
    this.ensureUnlocked();
    await this.persistVault(newDeviceKey);
  }

  // ─── Internal ───────────────────────────────────────────────────

  private getCurrentKey(): Hex {
    if (!this.vault) {
      throw new Error('Keyring is locked. Cannot sign.');
    }
    const owner = this.vault.owners.find((o) => o.id === this.vault!.currentOwnerId);
    if (!owner) {
      throw new Error('Current owner key not found in vault.');
    }
    return owner.key;
  }

  private ensureUnlocked(): void {
    if (!this.vault) {
      throw new Error('Keyring is locked. Run `elytro init` first.');
    }
  }

  private async persistVault(deviceKey: Uint8Array): Promise<void> {
    if (!this.vault) throw new Error('No vault to persist.');
    const encrypted = await encryptWithKey(deviceKey, this.vault!);
    await this.store.save(STORAGE_KEY, encrypted);
  }
}
