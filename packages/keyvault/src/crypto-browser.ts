import { Result, Ok, Err } from '@elytro/result';
import { scrypt as _scrypt } from 'scrypt-js';
import scryptConfig from './config/scryptConfig.js';
import { ethers } from 'ethers';

/* 

   Using the Web Crypto API in the browser environment is not just because of its high performance,
   but more importantly, it provides memory-invisible key storage: CryptoKey

*/

function cryptoAPIGuard() {
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
  } else {
    throw new Error('Web Crypto API is not available');
  }
}

export class AES_256_GCM {
  private static VERSION = '001';
  private static AUTH_TAG_BYTES = 8;
  private static AUTH_TAG_BITS = 8 * AES_256_GCM.AUTH_TAG_BYTES;
  private static ALGORITHM = {
    name: 'AES-GCM',
    length: 256,
    tagLength: AES_256_GCM.AUTH_TAG_BITS,
  };

  private _cryptoKey: CryptoKey | undefined;
  constructor(cryptoKey: CryptoKey) {
    cryptoAPIGuard();
    this._cryptoKey = cryptoKey;
  }

  public static async randomAesVault(): Promise<AES_256_GCM> {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return new AES_256_GCM(key);
  }

  public destroy() {
    this._cryptoKey = undefined;
  }

  public static async init(
    base64Key: string
  ): Promise<Result<AES_256_GCM, Error>> {
    const key = await AES_256_GCM.importKey(base64Key);
    if (key.isErr() === true) {
      return new Err(key.ERR);
    }
    return new Ok(new AES_256_GCM(key.OK));
  }

  public static async generateAndExportKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const jwk = await window.crypto.subtle.exportKey('jwk', key);
    if (jwk.k === undefined || jwk.k === '') {
      throw new Error('can not generate AES256GCM key');
    }
    return jwk.k;
  }

  private static async importKey(
    strKey: string
  ): Promise<Result<CryptoKey, Error>> {
    // base64 strKey to Uint8Array
    const binaryKey = window.atob(strKey);
    const keyBuffer = new ArrayBuffer(binaryKey.length);
    const keyView = new Uint8Array(keyBuffer);
    for (let i = 0; i < binaryKey.length; i++) {
      keyView[i] = binaryKey.charCodeAt(i);
    }
    try {
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false /* highlight */,
        ['encrypt', 'decrypt']
      );
      return new Ok(key);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }

    // try {
    //     const key = await window.crypto.subtle.importKey(
    //         "jwk",
    //         { "alg": "A256GCM", "ext": true, "k": strKey, "key_ops": ["encrypt", "decrypt"], "kty": "oct" },
    //         { name: "AES-GCM" },
    //         false/* highlight */,
    //         ["encrypt", "decrypt"]
    //     );
    //     return new Ok(key);
    // } catch (error: unknown) {
    //     if (error instanceof Error) {
    //         return new Err(error);
    //     } else {
    //         return new Err(new Error('unknown error'));
    //     }
    // }
  }

  static uint8ArrayToBase64(bytes: Uint8Array): Result<string, Error> {
    try {
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return new Ok(window.btoa(binary));
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  static base64ToUint8Array(base64: string): Result<Uint8Array, Error> {
    try {
      const binary = window.atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Ok(bytes);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  public async encrypt(text: string): Promise<Result<string, Error>> {
    try {
      return this._encrypt(this._cryptoKey!, text);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  public async decrypt(
    encryptedTextWithIvAndTag: string
  ): Promise<Result<string, Error>> {
    try {
      return this._decrypt(this._cryptoKey!, encryptedTextWithIvAndTag);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async _encrypt(
    keyBuffer: CryptoKey,
    text: string
  ): Promise<Result<string, Error>> {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      const encoded = Utils.toBuffer(text);
      const encryptedText = await window.crypto.subtle.encrypt(
        {
          ...AES_256_GCM.ALGORITHM,
          iv: iv,
        },
        keyBuffer,
        encoded
      );
      const versonBuffer = Utils.toBuffer(AES_256_GCM.VERSION);
      const combinedBuffer = new Uint8Array(
        3 /*versonBuffer.length*/ + 16 /*iv.length*/ + encryptedText.byteLength
      );
      combinedBuffer.set(versonBuffer, 0);
      combinedBuffer.set(iv, 3);
      combinedBuffer.set(
        new Uint8Array(encryptedText),
        3 /*versonBuffer.length*/ + 16 /*iv.length*/
      );
      const encryptedTextWithIvAndTag =
        await AES_256_GCM.uint8ArrayToBase64(combinedBuffer);
      return encryptedTextWithIvAndTag;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async _decrypt(
    keyBuffer: CryptoKey,
    encryptedTextWithIvAndTag: string
  ): Promise<Result<string, Error>> {
    try {
      const u8Arrary = await AES_256_GCM.base64ToUint8Array(
        encryptedTextWithIvAndTag
      );
      if (u8Arrary.isErr() === true) {
        return new Err(u8Arrary.ERR);
      }
      const data = u8Arrary.OK;
      const version = new TextDecoder().decode(data.subarray(0, 3));
      if (version !== '001') {
        return new Err(new Error('unknow versoin'));
      }
      const iv = data.subarray(3, 19);
      const encryptedText = data.subarray(19);
      const decrypted = await window.crypto.subtle.decrypt(
        {
          ...AES_256_GCM.ALGORITHM,
          iv: iv,
        },
        keyBuffer,
        encryptedText
      );
      const decryptedText = new TextDecoder().decode(decrypted);
      return new Ok(decryptedText);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }
}

/**
 * ECDSA
 * Web Crypto API not support secp256k1 yet, so we use ethers.js (noble-secp256k1)
 * @export
 * @class ECDSA
 */
export class ECDSA {
  private _encryptedPrivateKey: string | undefined;
  private _AES_256_GCM: AES_256_GCM | undefined;
  constructor() {
    cryptoAPIGuard();
  }

  async init(privateKey: string) {
    if (this._AES_256_GCM === undefined) {
      this._AES_256_GCM = await AES_256_GCM.randomAesVault();
      const ret = await this._AES_256_GCM.encrypt(privateKey);
      if (ret.isErr() === true) {
        throw ret.ERR;
      }
      this._encryptedPrivateKey = ret.OK;
    } else {
      throw new Error('already init');
    }
  }

  public destroy() {
    if (this._AES_256_GCM !== undefined) {
      this._AES_256_GCM.destroy();
      this._AES_256_GCM = undefined;
    }
    if (this._encryptedPrivateKey !== undefined) {
      this._encryptedPrivateKey = undefined;
    }
  }

  private static onlyBytes32(bytes32: string) {
    const regex = /^0x[a-fA-F0-9]{64}$/;
    if (!regex.test(bytes32)) {
      return new Err('sign message must be bytes32');
    }
  }

  private async _decryptPrivateKey(): Promise<string> {
    if (
      this._encryptedPrivateKey === undefined ||
      this._AES_256_GCM === undefined
    ) {
      throw new Error('not init');
    }
    const ret = await this._AES_256_GCM.decrypt(this._encryptedPrivateKey);
    if (ret.isErr() === true) {
      throw ret.ERR;
    }
    return ret.OK;
  }

  async sign(message: string): Promise<string> {
    ECDSA.onlyBytes32(message);
    let _privateKey = await this._decryptPrivateKey();
    let _signKey: ethers.SigningKey | undefined = new ethers.SigningKey(
      _privateKey
    );
    _privateKey = '';
    // In ethers.js, the `message` has already been copied, so we don't need to worry about issues caused by data modification
    const signature = _signKey!.sign(message).serialized;
    _signKey = undefined;
    return signature;
  }

  async personalSign(message: string): Promise<string> {
    ECDSA.onlyBytes32(message);
    let _privateKey = await this._decryptPrivateKey();
    let _signKey: ethers.SigningKey | undefined = new ethers.SigningKey(
      _privateKey
    );
    _privateKey = '';
    // In ethers.js, the `message` has already been copied, so we don't need to worry about issues caused by data modification
    const signature = _signKey!.sign(
      ethers.hashMessage(ethers.getBytes(message))
    ).serialized;
    _signKey = undefined;
    return signature;
  }
}

/**
 * Anti-Brute-Force Algorithm
 *
 * @export
 * @class ABFA
 */
export class ABFA {
  static async scrypt(
    password: string,
    salt: string = scryptConfig.salt,
    N = scryptConfig.N,
    r = scryptConfig.r,
    p = scryptConfig.p
  ): Promise<Result<string, Error>> {
    /*
     * Note: in scrypt-js: password = (password.length <= 64) ? password : SHA256(password);
     */
    const passwordBuffer = Utils.toBuffer(password.slice() /* make a copy */);
    password = ''; // clear password
    const keylen = scryptConfig.keylen;
    try {
      const key: Uint8Array = await _scrypt(
        passwordBuffer,
        Utils.toBuffer(salt),
        N,
        r,
        p,
        keylen
      );
      // clear passwordBuffer
      for (let i = 0; i < passwordBuffer.length; i++) {
        passwordBuffer[i] = 0;
      }
      const _keyBase64 = await AES_256_GCM.uint8ArrayToBase64(key);
      if (_keyBase64.isErr() === true) {
        return new Err(_keyBase64.ERR);
      }
      const keyBase64 = _keyBase64.OK;
      return new Ok(keyBase64);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async argon2id(password: string, salt: string): Promise<string> {
    throw new Error('not implemented');
  }
}

export class Utils {
  static toBuffer(value: string): Uint8Array {
    return new TextEncoder().encode(value);
  }

  static readonly HexCharacters: string = '0123456789abcdef';
  static generatePrivateKey(): string {
    cryptoAPIGuard();

    const _bytes = new Uint8Array(32);
    window.crypto.getRandomValues(_bytes);

    // refer to: ethers.js -> utils/data.ts
    let result = '0x';
    for (let i = 0; i < _bytes.length; i++) {
      const v = _bytes[i];
      result +=
        Utils.HexCharacters[(v & 0xf0) >> 4 /* get higher 4bits  */] +
        Utils.HexCharacters[v & 0x0f /* get lower 4bits */];
    }
    return result;
  }
}
