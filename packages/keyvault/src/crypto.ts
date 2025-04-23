import { Result, Ok, Err } from '@elytro/result';
import { Buffer } from 'buffer';
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scrypt as _scrypt,
} from 'crypto';
import { ethers } from 'ethers';
import scryptConfig from './config/scryptConfig.js';

export class AES_256_GCM {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly VERSION = '001';
  private static AUTH_TAG_BYTES = 8;

  private _keyBuffer: Buffer;
  constructor(keyBuffer: Buffer) {
    this._keyBuffer = keyBuffer;
  }

  public static async randomAesVault(): Promise<AES_256_GCM> {
    const key = randomBytes(32); // 256 bits
    return new AES_256_GCM(key);
  }

  public destroy() {
    this._keyBuffer.fill(0);
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
    const key = randomBytes(32); // 256 bits
    return key.toString('base64');
  }

  private static async importKey(
    strKey: string
  ): Promise<Result<Buffer, Error>> {
    try {
      const keyBuffer = Buffer.from(strKey, 'base64');
      return new Ok(keyBuffer);
    } catch (error) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('Unknown error'));
      }
    }
  }

  public async encrypt(text: string): Promise<Result<string, Error>> {
    return this._encrypt(this._keyBuffer, text);
  }

  public async decrypt(
    encryptedTextWithIvAndTag: string
  ): Promise<Result<string, Error>> {
    return this._decrypt(this._keyBuffer, encryptedTextWithIvAndTag);
  }

  private async _encrypt(
    keyBuffer: Buffer,
    text: string
  ): Promise<Result<string, Error>> {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(AES_256_GCM.ALGORITHM, keyBuffer, iv, {
        authTagLength: AES_256_GCM.AUTH_TAG_BYTES,
      });
      const encryptedText = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();
      const versonBuffer = Utils.toBuffer(AES_256_GCM.VERSION);
      return new Ok(
        Buffer.concat([versonBuffer, iv, encryptedText, authTag]).toString(
          'base64'
        )
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async _decrypt(
    keyBuffer: Buffer,
    encryptedTextWithIvAndTag: string
  ): Promise<Result<string, Error>> {
    try {
      const data = Buffer.from(encryptedTextWithIvAndTag, 'base64');
      const version = data.subarray(0, 3).toString();
      if (version !== '001') {
        return new Err(new Error('unknow versoin'));
      }
      const iv = data.subarray(3, 19);
      const encryptedText = data.subarray(
        19,
        data.length - AES_256_GCM.AUTH_TAG_BYTES
      );
      const authTag = data.subarray(data.length - AES_256_GCM.AUTH_TAG_BYTES);
      const decipher = createDecipheriv(AES_256_GCM.ALGORITHM, keyBuffer, iv, {
        authTagLength: AES_256_GCM.AUTH_TAG_BYTES,
      });
      decipher.setAuthTag(authTag);
      const decryptedText = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final(),
      ]);
      return new Ok(decryptedText.toString());
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }
}

export class ECDSA {
  private _encryptedPrivateKey: string | undefined;
  private _AES_256_GCM: AES_256_GCM | undefined;
  private _address: string | undefined;
  private _path: string | undefined;
  constructor() {}

  async init(privateKey: string, address: string, path: string) {
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

    this._address = address;
    this._path = path;
  }

  public destroy() {
    if (this._AES_256_GCM !== undefined) {
      this._AES_256_GCM.destroy();
      this._AES_256_GCM = undefined;
    }
    if (this._encryptedPrivateKey !== undefined) {
      this._encryptedPrivateKey = undefined;
    }
    this._address = undefined;
    this._path = undefined;
  }

  public get address(): string {
    if (this._address === undefined) {
      throw new Error('not init');
    }
    return this._address;
  }

  public get path(): string {
    if (this._path === undefined) {
      throw new Error('not init');
    }
    return this._path;
  }

  private static onlyBytes32(bytes32: string) {
    const regex = /^0x[a-fA-F0-9]{64}$/;
    if (!regex.test(bytes32)) {
      return new Err('sign message must be bytes32');
    }
  }

  // async getAddress(): Promise<string> {
  //     const _privateKey = await this._decryptPrivateKey();
  //     let _signKey: ethers.SigningKey | undefined = new ethers.SigningKey(_privateKey);
  //     const address = ethers.getAddress(_signKey!.publicKey);
  //     _signKey = undefined;
  //     return address;
  // }

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

  async sign(message: string | Uint8Array): Promise<string> {
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

  async personalSign(message: string | Uint8Array): Promise<string> {
    let _privateKey = await this._decryptPrivateKey();
    let _signKey: ethers.SigningKey | undefined = new ethers.SigningKey(
      _privateKey
    );
    _privateKey = '';
    // In ethers.js, the `message` has already been copied, so we don't need to worry about issues caused by data modification
    const messageHash = ethers.hashMessage(message);
    const signature = _signKey!.sign(messageHash).serialized;
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
  static scrypt(
    password: string,
    salt: string = scryptConfig.salt,
    N = scryptConfig.N,
    r = scryptConfig.r,
    p = scryptConfig.p
  ): Promise<Result<string, Error>> {
    return new Promise((resolve) => {
      const passwordBuffer = Utils.toBuffer(password.slice() /* make a copy */);
      password = ''; // clear password
      const keylen = scryptConfig.keylen;
      _scrypt(
        passwordBuffer,
        Utils.toBuffer(salt),
        keylen,
        { N, r, p },
        (error, derivedKey) => {
          if (error) {
            if (error instanceof Error) {
              resolve(new Err(error));
            } else {
              resolve(new Err(new Error('unknown error')));
            }
          } else {
            const key = derivedKey.toString('base64').slice(); /* make a copy */
            // clear derivedKey
            derivedKey.fill(0);
            resolve(new Ok(key));
          }
        }
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async argon2id(password: string, salt: string): Promise<string> {
    // const _salt = Buffer.from(salt, 'utf8');
    // const hash = await _argon2.hash(password, {
    //     raw: false,
    //     salt: _salt,
    //     hashLength: 32,
    //     timeCost: 3,
    //     memoryCost: 4096,
    //     parallelism: 1,
    //     type: 2/*argon2id*/,
    //     version: 19
    // });
    // return hash;
    throw new Error('not implemented');
  }
}

export class Utils {
  static toBuffer(value: string): Buffer {
    return Buffer.from(value, 'utf8');
  }

  static generatePrivateKey(): string {
    return '0x' + randomBytes(32).toString('hex');
  }
  static generateSeed(): string {
    return '0x' + randomBytes(64).toString('hex');
  }
}
