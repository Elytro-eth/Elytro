import { Result, Ok, Err } from '@elytro/result';
import { IVault, SignData, VaultEvents } from './interface/IVault.js';
import { Storage } from './storage.js';
import { AES_256_GCM, ECDSA, ABFA, Utils } from './crypto.js';
import { ethers, Mnemonic } from 'ethers';
import mitt, { Emitter } from 'mitt';

class KeyVaultStorageStructure {
  AESKeyHash: string = '';
  EncryptedSeed: string = '';

  toString(): string {
    return JSON.stringify({
      AESKeyHash: this.AESKeyHash,
      EncryptedSeed: this.EncryptedSeed,
    });
  }

  fromString(data: string): KeyVaultStorageStructure {
    if (data === '') {
      return this;
    } else {
      const obj = JSON.parse(data);
      this.AESKeyHash = obj.AESKeyHash;
      this.EncryptedSeed = obj.EncryptedSeed;
      return this;
    }
  }
}

/**
 * Vault
 *
 * @export
 * @class Vault
 * @implements {IVault}
 */
export class Vault implements IVault {
  private _storage: Storage;
  private _AES_256_GCM: AES_256_GCM | undefined;

  private _KeyVaultDataCache: KeyVaultStorageStructure | undefined = undefined;

  private _accounts: Map<string, ECDSA> = new Map();

  private _EventEmitter: Emitter<VaultEvents>;

  private _timeout: NodeJS.Timeout | undefined;
  private readonly _timeoutDuration = 1000 * 60 * 60; // 60 minutes
  private _lockTime: number = 0;

  public static readonly DEFAULT_PATH = "m/44'/60'/0'/0/0";

  /**
   * Creates an instance of Vault.
   * @param {string} tag tag for keyVault
   * @memberof Vault
   */
  public constructor(tag: string) {
    tag = tag.slice(); /* make a copy */
    this._storage = new Storage(Vault._hash(tag));

    if (typeof window !== 'undefined') {
      // Web Crypto API
      if (
        typeof window.crypto === 'object' &&
        typeof window.crypto.subtle === 'object'
      ) {
        // support Web Crypto API
      } else {
        throw new Error('Web Crypto API is not available');
      }
    }

    this._EventEmitter = mitt<VaultEvents>();
  }

  /**
   * destroy vault
   *
   * @static
   * @param {string} tag tag for keyVault
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public static async remove(tag: string): Promise<Result<void, Error>> {
    const _storage = new Storage(Vault._hash(tag));
    return await _storage.selfDestruct();
  }

  /**
   * rename vault, must lock first
   *
   * @static
   * @param {string} oldTag old tag
   * @param {string} newTag new tag
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public static async rename(
    oldTag: string,
    newTag: string
  ): Promise<Result<void, Error>> {
    const _storageOld = new Storage(Vault._hash(oldTag));
    const _storageNew = new Storage(Vault._hash(newTag));
    const _retOld = await _storageOld.load('');
    const _retNew = await _storageNew.load('');
    if (_retOld.isErr() === true) {
      return new Err(_retOld.ERR);
    }
    if (_retNew.isErr() === true) {
      return new Err(_retNew.ERR);
    }
    if (_retNew.OK !== '') {
      return new Err(new Error(`${newTag} already exists`));
    }
    if (_retOld.OK === '') {
      return new Err(new Error(`${oldTag} not exists`));
    }
    let _ret = await _storageNew.save(_retOld.OK);
    if (_ret.isErr() === true) {
      return new Err(_ret.ERR);
    }
    _ret = await _storageOld.selfDestruct();
    if (_ret.isErr() === true) {
      console.error(_ret.ERR);
    }
    return new Ok(void 0);
  }

  /**
   * add event listener
   *
   * @template Key extends keyof VaultEvents
   * @param {Key} eventName event name
   * @param {(arg: VaultEvents[Key]) => unknown} handler event handler
   * @memberof Vault
   */
  public on<Key extends keyof VaultEvents>(
    eventName: Key,
    handler: (arg: VaultEvents[Key]) => unknown
  ) {
    try {
      this._EventEmitter.on(eventName, handler);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  /**
   * remove event listener
   *
   * @template Key extends keyof VaultEvents
   * @param {Key} eventName event name
   * @param {(arg: VaultEvents[Key]) => unknown} [handler] event handler
   * @memberof Vault
   */
  public off<Key extends keyof VaultEvents>(
    eventName: Key,
    handler?: (arg: VaultEvents[Key]) => unknown
  ) {
    try {
      this._EventEmitter.off(eventName, handler);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  private emit<Key extends keyof VaultEvents>(
    eventName: Key,
    payload: VaultEvents[Key]
  ) {
    if (eventName !== 'Locked') {
      this._touchTimeout(eventName !== 'Ping');
    } else {
      this._clearTimeout();
    }

    this._EventEmitter.emit(eventName, payload);
  }

  private _touchTimeout(createTimer: boolean) {
    this._lockTime = new Date().getTime() + this._timeoutDuration;
    if (createTimer === true && this._timeout === undefined) {
      this._timeout = setInterval(async () => {
        if (new Date().getTime() > this._lockTime) {
          this.lock().catch();
        }
      }, 1000 * 5);
    }
  }

  private _clearTimeout() {
    if (this._timeout !== undefined) {
      clearInterval(this._timeout);
      this._timeout = undefined;
    }
  }

  private async _loadData(): Promise<Result<KeyVaultStorageStructure, Error>> {
    if (this._KeyVaultDataCache === undefined) {
      const ret = await this._storage.load('');
      if (ret.isErr() === true) {
        return new Err(ret.ERR);
      }
      try {
        const _KeyVaultStorageStructure: KeyVaultStorageStructure =
          new KeyVaultStorageStructure().fromString(ret.OK);
        this._KeyVaultDataCache = _KeyVaultStorageStructure;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return new Err(error);
        } else {
          console.error(error);
          return new Err(new Error('unknown error'));
        }
      }
    }
    return new Ok(this._KeyVaultDataCache);
  }

  private async _saveData(
    keyVaultStorageStructure: KeyVaultStorageStructure
  ): Promise<Result<void, Error>> {
    this._KeyVaultDataCache = keyVaultStorageStructure;
    const ret = await this._storage.save(keyVaultStorageStructure.toString());
    if (ret.isErr() === true) {
      return new Err(ret.ERR);
    }
    return new Ok(void 0);
  }

  private async _deriveKey(password: string): Promise<Result<string, Error>> {
    const _key = await ABFA.scrypt(password);
    if (_key.isErr() === true) {
      return new Err(_key.ERR);
    }
    const key = _key.OK;
    return new Ok(key);
  }

  private static _hash(data: string): string {
    const _salt = '@key-hash-salt';
    return ethers.keccak256(ethers.toUtf8Bytes(_salt + data));
  }

  /**
   * initialize vault with bip39 phrase
   *
   * @param {string} phrase 12 words bip39 phrase,split by space
   * @param {string} password
   * @param {boolean} [enforce] if true, delete all data and re-initialize
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public async initBip39(
    phrase: string,
    password: string,
    enforce?: boolean
  ): Promise<Result<void, Error>> {
    phrase = phrase.slice(); /* make a copy */
    password = password.slice(); /* make a copy */
    let seed = '';
    try {
      const mnemonic = Mnemonic.fromPhrase(phrase);
      seed = mnemonic.computeSeed();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
    return await this._init(seed, password, enforce);
  }

  /**
   * initialize vault
   *
   * @param {string} password
   * @param {boolean} [enforce] if true, delete all data and re-initialize
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public async init(
    password: string,
    enforce?: boolean
  ): Promise<Result<void, Error>> {
    password = password.slice(); /* make a copy */
    const seed = Utils.generateSeed();
    return await this._init(seed, password, enforce);
  }

  private async _init(
    seed: string,
    password: string,
    enforce?: boolean
  ): Promise<Result<void, Error>> {
    if (enforce === true) {
      // delete all data
      await this.destroy();
      const ret = await this._storage.selfDestruct();
      if (ret.isErr() === true) {
        return new Err(ret.ERR);
      }
    }
    if (await this._isInitialized()) {
      return new Err(new Error('already initialized'));
    } else {
      const _key = await this._deriveKey(password);
      if (_key.isErr() === true) {
        return new Err(_key.ERR);
      }
      const _aes = await AES_256_GCM.init(_key.OK);
      if (_aes.isErr() === true) {
        return new Err(_aes.ERR);
      }
      this._AES_256_GCM = _aes.OK;

      const AESKeyHash = Vault._hash(_key.OK);

      const _encryptRet = await this._AES_256_GCM!.encrypt(seed);
      if (_encryptRet.isErr() === true) {
        return new Err(_encryptRet.ERR);
      }

      const _KeyVaultStorageStructure: KeyVaultStorageStructure =
        new KeyVaultStorageStructure();
      _KeyVaultStorageStructure.AESKeyHash = AESKeyHash;
      _KeyVaultStorageStructure.EncryptedSeed = _encryptRet.OK;
      const _ret = await this._saveData(_KeyVaultStorageStructure);
      if (_ret.isErr() === true) {
        return new Err(_ret.ERR);
      }

      this.emit(enforce === true ? 'ReInitialized' : 'Initialized', void 0);

      this.emit('Unlocked', void 0);

      return new Ok(void 0);
    }
  }

  /**
   * not implemented
   *
   * @param {string} exportData
   * @param {string} password
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */

  public async restore(/*exportData: string, password: string*/): Promise<
    Result<void, Error>
  > {
    throw new Error('Method not implemented.');
  }

  /**
   * check if vault is initialized
   *
   * @return {*}  {Promise<Result<boolean, Error>>}
   * @memberof Vault
   */
  public async isInitialized(): Promise<Result<boolean, Error>> {
    const ret = await this._loadData();
    if (ret.isErr() === true) {
      return new Err(ret.ERR);
    }

    this.emit('Ping', void 0);

    return new Ok(ret.OK.AESKeyHash !== '');
  }

  /**
   * for security reason, allways call this method after use
   *
   * @return {*}  {Promise<void>}
   * @memberof Vault
   */
  private async destroy(): Promise<void> {
    if (this._AES_256_GCM) {
      this._AES_256_GCM = undefined;
    }
    this._KeyVaultDataCache = undefined;
    for (const i of this._accounts.values()) {
      try {
        i.destroy();
      } catch (error) {
        console.error(error);
      }
    }
    this._accounts.clear();
  }

  private async _isInitialized(): Promise<boolean> {
    const ret = await this.isInitialized();
    if (ret.isErr() === true) {
      return false;
    }
    return ret.OK;
  }

  /**
   * unlock keyVault
   *
   * @param {string} password
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public async unlock(password: string): Promise<Result<void, Error>> {
    if (!(await this._isInitialized())) {
      return new Err(new Error('not initialized'));
    } else {
      const ret = await this.isLocked();
      if (ret.isErr() === true) {
        return new Err(ret.ERR);
      }
      if (ret.OK === false) {
        return new Err(new Error('already unlocked'));
      }

      const _key = await this._deriveKey(password);
      if (_key.isErr() === true) {
        return new Err(_key.ERR);
      }
      const _hash = Vault._hash(_key.OK);

      const keyVaultStorageStructure = await this._loadData();
      if (keyVaultStorageStructure.isErr() === true) {
        return new Err(keyVaultStorageStructure.ERR);
      }

      if (_hash !== keyVaultStorageStructure.OK.AESKeyHash) {
        return new Err(new Error('invalid password'));
      }
      const _aes = await AES_256_GCM.init(_key.OK);
      if (_aes.isErr() === true) {
        return new Err(_aes.ERR);
      }
      this._AES_256_GCM = _aes.OK;

      this.emit('Unlocked', void 0);

      return new Ok(void 0);
    }
  }

  /**
   * lock keyVault
   *
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */
  public async lock(): Promise<Result<void, Error>> {
    if (!(await this._isInitialized())) {
      return new Err(new Error('not initialized'));
    } else {
      const ret = await this.isLocked();
      if (ret.isErr() === true) {
        return new Err(ret.ERR);
      }
      if (ret.OK === true) {
        return new Err(new Error('already locked'));
      }
      await this.destroy();
      this.emit('Locked', void 0);
      return new Ok(void 0);
    }
  }

  /**
   * check if vault is locked
   *
   * @return {*}  {Promise<Result<boolean, Error>>}
   * @memberof Vault
   */
  public async isLocked(): Promise<Result<boolean, Error>> {
    this.emit('Ping', void 0);
    return new Ok(this._AES_256_GCM === undefined);
  }

  /**
   * not implemented
   *
   * @param {string} oldPassword
   * @param {string} newPassword
   * @return {*}  {Promise<Result<void, Error>>}
   * @memberof Vault
   */

  public async changePassword(/*oldPassword: string, newPassword: string*/): Promise<
    Result<void, Error>
  > {
    if ((await this.isLocked()).OK === true) {
      return new Err(new Error('locked'));
    }
    throw new Error('Method not implemented.');
  }

  public async getSigner(
    path: string | undefined
  ): Promise<Result<string /* EOA address */, Error>> {
    const _ECDSA = await this._loadSigner(path);
    if (_ECDSA.isErr() === true) {
      return new Err(_ECDSA.ERR);
    }
    const _address = await _ECDSA.OK.address;
    return new Ok(_address);
  }

  private async _loadSigner(
    path: string | undefined
  ): Promise<Result<ECDSA, Error>> {
    if ((await this.isLocked()).OK === true) {
      return new Err(new Error('locked'));
    }
    if (path === undefined || path.startsWith('m') === false) {
      path = Vault.DEFAULT_PATH;
    }
    if (this._accounts.has(path)) {
      return new Ok(this._accounts.get(path)!);
    }

    const ret = await this._loadData();
    if (ret.isErr() === true) {
      return new Err(ret.ERR);
    }

    const _ECDSA = new ECDSA();
    const _decryptRet = await this._AES_256_GCM!.decrypt(ret.OK.EncryptedSeed);
    if (_decryptRet.isErr() === true) {
      return new Err(_decryptRet.ERR);
    }

    const HDWallet = ethers.HDNodeWallet.fromSeed(_decryptRet.OK);
    let wallet: ethers.HDNodeWallet | undefined = undefined;
    try {
      wallet = HDWallet.derivePath(path);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
    await _ECDSA.init(wallet.privateKey, wallet.address, path);
    this._accounts.set(path, _ECDSA);

    return new Ok(_ECDSA);
  }

  /**
   * sign a message (personalSign)
   *
   * @param {(string | Uint8Array)} byte32Message
   * @param {(string | undefined)} path
   * @return {*}  {Promise<Result<SignData, Error>>}
   * @memberof Vault
   */
  public async personalSign(
    byte32Message: string | Uint8Array,
    path: string | undefined
  ): Promise<Result<SignData, Error>> {
    const _ECDSA = await this._loadSigner(path);
    if (_ECDSA.isErr() === true) {
      return new Err(_ECDSA.ERR);
    }
    const _address = _ECDSA.OK.address;
    const _path = _ECDSA.OK.path;
    const _sign = await _ECDSA.OK.personalSign(byte32Message);

    const _signData: SignData = {
      address: _address,
      path: _path,
      message: byte32Message,
      signature: _sign,
    };

    this.emit('PersonalSign', _signData);

    return new Ok(_signData);
  }

  /**
   * sign a message (rawSign)
   *
   * @private
   * @param {(string | Uint8Array)} byte32Message
   * @param {(string | undefined)} path
   * @return {*}  {Promise<Result<SignData, Error>>}
   * @memberof Vault
   */
  private async _rawSign(
    byte32Message: string | Uint8Array,
    path: string | undefined
  ): Promise<Result<SignData, Error>> {
    const _ECDSA = await this._loadSigner(path);
    if (_ECDSA.isErr() === true) {
      return new Err(_ECDSA.ERR);
    }
    const _address = _ECDSA.OK.address;
    const _path = _ECDSA.OK.path;
    const _sign = await _ECDSA.OK.sign(byte32Message);

    const _signData: SignData = {
      address: _address,
      path: _path,
      message: byte32Message,
      signature: _sign,
    };

    // this.emit('Sign', _signData);
    return new Ok(_signData);
  }

  /**
   *
   *
   * @param {(string|Uint8Array)} byte32Message
   * @param {(string | undefined)} path
   * @return {*}  {Promise<Result<SignData, Error>>}
   * @memberof Vault
   */
  public async rawSign(
    byte32Message: string | Uint8Array,
    path: string | undefined
  ): Promise<Result<SignData, Error>> {
    const ret = await this._rawSign(byte32Message, path);
    if (ret.isOk() === true) {
      this.emit('Sign', ret.OK);
    }
    return ret;
  }

  // /**
  //  * sign typedData message (EIP712)
  //  *
  //  * @param {string} address
  //  * @param {ethers.TypedDataDomain} domain
  //  * @param {Record<string, Array<ethers.TypedDataField>>} types
  //  * @param {Record<string, any>} value
  //  * @param {(string | ethers.JsonRpcProvider)} [provider]
  //  * @return {*}  {Promise<Result<string, Error>>}
  //  * @memberof Vault
  //  */
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // public async typedDataSign(path: string | undefined, domain: ethers.TypedDataDomain, types: Record<string, Array<ethers.TypedDataField>>, value: Record<string, any>, provider?: string | ethers.JsonRpcProvider): Promise<Result<SignData, Error>> {
  //     // refer: ethers.js

  //     let _provider: ethers.JsonRpcProvider | null = null;
  //     if (provider !== undefined) {
  //         if (typeof provider === 'string') {
  //             _provider = new ethers.JsonRpcProvider(provider);
  //         } else {
  //             _provider = provider;
  //         }
  //     }

  //     // Populate any ENS names
  //     const populated = await ethers.TypedDataEncoder.resolveNames(domain, types, value, async (name: string) => {
  //         // @TODO: this should use resolveName; addresses don't
  //         //        need a provider

  //         ethers.assert(_provider != null, "cannot resolve ENS names without a provider", "UNSUPPORTED_OPERATION", {
  //             operation: "resolveName",
  //             info: { name }
  //         });

  //         const address = await _provider!.resolveName(name);
  //         ethers.assert(address != null, "unconfigured ENS name", "UNCONFIGURED_NAME", {
  //             value: name
  //         });

  //         return address;
  //     });

  //     const message = ethers.TypedDataEncoder.hash(populated.domain, types, populated.value);
  //     const ret = await this._rawSign(path, message);
  //     if (ret.isOk() === true) {
  //         this.emit('TypedDataSign', ret.OK);
  //     }
  //     return ret;
  // }
}
