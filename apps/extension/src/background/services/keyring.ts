import { decrypt, encrypt, TPasswordEncryptedData } from '@/utils/passworder';
import { Address, Hex } from 'viem';
import { PrivateKeyAccount, generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import sessionManager from './session';
import { sessionStorage } from '@/utils/storage/session';
import { SigningKey } from '@ethersproject/signing-key';
import LocalSubscribableStore from '@/utils/store/LocalSubscribableStore';

type TOwnerData = {
  id: string; // aka address
  key: Hex;
};

type TVaultData = {
  owners: TOwnerData[];
  currentOwnerId: string;
};

type KeyringServiceState = {
  data?: TPasswordEncryptedData;
};

const KEYRING_STORAGE_KEY = 'elytroKeyringState';

class KeyringService {
  private _locked = true;
  private _signingKey: Nullable<SigningKey> = null; // also the current owner's signing key
  private _currentOwner: Nullable<PrivateKeyAccount> = null;
  private _owners: TOwnerData[] = [];
  private _store: LocalSubscribableStore<KeyringServiceState>;

  constructor() {
    this._store = new LocalSubscribableStore<KeyringServiceState>(KEYRING_STORAGE_KEY, () => {
      this._verifyPassword();
    });
  }

  get hasOwner() {
    return !!this._store.state.data;
  }

  get currentOwner() {
    return this._currentOwner;
  }

  get signingKey() {
    return this._signingKey;
  }

  get locked() {
    return this._locked;
  }

  private get _encryptData() {
    return this._store.state.data;
  }

  private set _encryptData(data: TPasswordEncryptedData | undefined) {
    this._store.state.data = data;
  }

  public async createNewOwner(password?: string) {
    await this._verifyPassword(password);

    try {
      const key = generatePrivateKey();
      const ownerAccount = privateKeyToAccount(key);
      const ownerData: TOwnerData = {
        id: ownerAccount.address,
        key,
      };

      this._signingKey = new SigningKey(key);
      this._currentOwner = ownerAccount;
      this._owners = [...(this._owners || []), ownerData];

      this._encryptData = await encrypt<TVaultData>(
        {
          owners: this._owners,
          currentOwnerId: ownerData.id,
        },
        password
      );

      console.log('Elytro: createNewOwner', this._currentOwner?.address);
      this._locked = false;
    } catch (error) {
      console.error(error);
      this._locked = true;
      throw new Error('Elytro: Failed to create a new owner');
    }
  }

  public async switchToOwner(ownerId: Address, password?: string) {
    await this._verifyPassword(password);

    const ownerData = await this._findOwner(ownerId);
    if (!ownerData) {
      throw new Error('Owner not found');
    }

    this._signingKey = new SigningKey(ownerData.key);
    this._currentOwner = privateKeyToAccount(ownerData.key);
  }

  private async _findOwner(address: Address): Promise<TOwnerData | null> {
    await this._verifyPassword();

    const ownerData = this._owners.find((owner) => owner.id === address);
    if (!ownerData) {
      return null;
    }

    return ownerData;
  }

  public async importOwners(vaultData: TVaultData, password: string) {
    try {
      this._owners = [...this._owners, ...vaultData.owners].filter(
        (owner, index, self) => self.findIndex((t) => t.id === owner.id) === index
      );

      const currentOwner = this._owners.find(
        (owner) => owner.id === this._currentOwner?.address || vaultData.currentOwnerId
      );

      if (!currentOwner) {
        throw new Error('Elytro: Current owner not found');
      }

      this._encryptData = await encrypt<TVaultData>(vaultData, password);
      this._signingKey = new SigningKey(currentOwner.key);
      this._currentOwner = privateKeyToAccount(currentOwner.key);
      this._locked = false;
    } catch {
      this._locked = true;
      throw new Error('Elytro: Failed to import owner');
    }
  }

  public async lock() {
    this.reset();
    sessionStorage.clear();
    sessionManager.broadcastMessage('accountsChanged', []);
  }

  public async unlock(password: string) {
    if (!password) {
      throw new Error('Password is required');
    }

    await this._verifyPassword(password);
    return this._locked;
  }

  public async isPasswordValid(password: string) {
    if (!this._encryptData) {
      return false;
    }

    try {
      await decrypt(this._encryptData, password);
      return true;
    } catch {
      return false;
    }
  }

  private async _verifyPassword(password?: string) {
    if (!password) {
      this._locked = !(this._owners.length > 0 && this._currentOwner && this._signingKey);
      return;
    }

    if (!this._encryptData) {
      this._locked = true;
      return;
    }

    try {
      const { owners, currentOwnerId } = await decrypt<TVaultData>(this._encryptData, password);
      this._owners = owners;

      if (this._owners.length > 0) {
        let ownerKey = this._owners.find((owner) => owner.id === currentOwnerId)?.key;
        if (!ownerKey) {
          ownerKey = this._owners[0].key;
        }
        this._currentOwner = privateKeyToAccount(ownerKey);
        this._signingKey = new SigningKey(ownerKey);
        this._locked = false;
      }
    } catch (error) {
      console.error('Elytro: _verifyPassword - Failed to decrypt:', error);
      this._locked = true;
    }
  }

  public async exportOwners(password: string) {
    if (!this._encryptData) {
      throw new Error('Cannot export owner if no owners exist');
    }
    return await decrypt(this._encryptData, password);
  }

  public async reset() {
    this._locked = true;
    this._signingKey = null;
    this._currentOwner = null;
    this._owners = [];
  }

  public async tryUnlock(callback?: () => void) {
    if (this._locked) {
      await this._verifyPassword();
    }
    callback?.();
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    await this._verifyPassword(oldPassword);

    if (this._owners.length === 0 || !this._currentOwner) {
      throw new Error('Cannot change password if no owners exist');
    }

    this._encryptData = await encrypt<TVaultData>(
      {
        owners: this._owners,
        currentOwnerId: this._currentOwner.address,
      },
      newPassword
    );
  }
}

const keyring = new KeyringService();
export default keyring;
