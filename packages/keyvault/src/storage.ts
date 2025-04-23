import { Result, Ok, Err } from '@elytro/result';
import { IStorage } from './interface/IStorage.js';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

export class Storage implements IStorage {
  private _signerStorageFile: string;

  constructor(tag: string) {
    if (
      typeof process === 'undefined' ||
      process.versions === undefined ||
      process.versions.node === undefined
    ) {
      throw new Error('only available in NodeJS');
    }

    const _storagedir = join(homedir(), '.elytroWallet');
    if (!existsSync(_storagedir)) {
      mkdirSync(_storagedir);
    }
    this._signerStorageFile = join(_storagedir, `keyvault-${tag}.db`);

    if (!existsSync(this._signerStorageFile)) {
      writeFileSync(this._signerStorageFile, '');
    }
  }

  // private async safeKey(str: string): Promise<string> {
  //     str = '@elytro/keyvault:' + str;
  //     const hash = createHash('sha256');
  //     hash.update(str);
  //     const digest = hash.digest('hex');
  //     return digest;
  // }

  // private paddingTo1MB(data: string): Result<string, Error> {
  //     // padding to 1MB
  //     const MB = 1024 * 1024;
  //     const len = Buffer.from(data).length;
  //     if (len > MB) {
  //         return new Err(new Error('data size over 1MB'));
  //     }
  //     const padding = ' '.repeat(MB - len);
  //     return new Ok(data + padding);
  // }

  public async save(value: string): Promise<Result<void, Error>> {
    try {
      writeFileSync(this._signerStorageFile, value);
      return new Ok(void 0);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  public async load(defaultValue: string): Promise<Result<string, Error>> {
    try {
      const data: string = readFileSync(this._signerStorageFile).toString(
        'utf-8'
      );
      if (data === '') {
        return new Ok(defaultValue);
      }
      return new Ok(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  public async selfDestruct(): Promise<Result<void, Error>> {
    // delete storage files
    try {
      writeFileSync(this._signerStorageFile, '');
      return new Ok(void 0);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }
}
