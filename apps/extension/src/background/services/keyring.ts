import { decrypt, encrypt, TPasswordEncryptedData } from '@/utils/passworder';
import { Hex } from 'viem';
import {
  PrivateKeyAccount,
  generatePrivateKey,
  privateKeyToAccount,
} from 'viem/accounts';
import sessionManager from './session';
import { sessionStorage } from '@/utils/storage/session';
import { SigningKey } from '@ethersproject/signing-key';
import LocalSubscribableStore from '@/utils/store/LocalSubscribableStore';

type KeyringServiceState = {
  data?: TPasswordEncryptedData;
};

const KEYRING_STORAGE_KEY = 'elytroKeyringState';

class KeyringService {
  private _locked = true;
  private _signingKey: Nullable<SigningKey> = null;
  private _owner: Nullable<PrivateKeyAccount> = null;
  private _store: LocalSubscribableStore<KeyringServiceState>;

  constructor() {
    this._store = new LocalSubscribableStore<KeyringServiceState>(
      KEYRING_STORAGE_KEY,
      () => {
        this._verifyPassword();
      }
    );
  }

  get hasOwner() {
    return !!this._store.state.data;
  }

  private get _encryptData() {
    return this._store.state.data;
  }

  private set _encryptData(data: TPasswordEncryptedData | undefined) {
    this._store.state.data = data;
  }

  public get signingKey() {
    return this._signingKey;
  }

  public get locked() {
    return this._locked;
  }

  public get owner() {
    return this._owner;
  }

  public async lock() {
    if (!this._owner) {
      throw new Error('Cannot lock if owner is not set');
    }
    this.reset();
    sessionStorage.clear(); // clear local password encrypted data
    sessionManager.broadcastMessage('accountsChanged', []);
  }

  public async createNewOwner(password: string) {
    // !TODO: maybe this check can be removed if we make sure user cannot turn back to create owner page
    // if (this._owner) {
    //   throw new Error('Cannot create new owner if owner is already set');
    // }

    try {
      const key = generatePrivateKey();
      this._signingKey = new SigningKey(key);
      this._owner = privateKeyToAccount(key);

      const encryptedData = await encrypt(
        {
          key,
        },
        password
      );
      this._encryptData = encryptedData;
      this._locked = false;
    } catch (error) {
      console.error(error);
      this._locked = true;
      throw new Error('Elytro: Failed to create new owner');
    }
  }

  public async unlock(password: string) {
    if (!password) {
      throw new Error('Password is required');
    }

    await this._verifyPassword(password);

    return this._locked;
  }

  private async _updateOwnerByKey(key: Hex) {
    this._signingKey = new SigningKey(key);
    this._owner = privateKeyToAccount(key);
  }

  private async _verifyPassword(password?: string) {
    if (!this._encryptData) {
      this._locked = true;
      return;
      // throw new Error('Cannot verify password if there is no previous owner');
    }

    try {
      const { key } = await decrypt(this._encryptData, password);

      this._updateOwnerByKey(key as Hex);
      this._locked = false;
    } catch {
      this._locked = true;
    }
  }

  public async reset() {
    this._owner = null;
    this._locked = true;
    this._signingKey = null;
  }

  public async tryUnlock(callback?: () => void) {
    if (this._locked) {
      await this._verifyPassword();
    }

    callback?.();
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    if (!this._owner) {
      throw new Error('Cannot reset password if owner is not set');
    }

    if (!this._encryptData) {
      this._locked = true;
      throw new Error('Cannot verify password if there is no previous owner');
    }

    const { key } = await decrypt(this._encryptData, oldPassword);
    const encryptedData = await encrypt({ key }, newPassword);

    this._encryptData = encryptedData;
  }
}

const keyring = new KeyringService();
export default keyring;
