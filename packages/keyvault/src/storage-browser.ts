import { Result, Ok, Err } from '@elytro/result';
import { IStorage } from './interface/IStorage.js';

export class Storage implements IStorage {
  private _chromeExtension = false;
  private _signerStorageKey: string;

  constructor(tag: string) {
    if (typeof window !== 'undefined') {
      if (typeof window.localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      // extension environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _window = window as any;
      if (
        typeof _window.chrome !== 'undefined' &&
        _window.chrome.runtime !== undefined &&
        _window.chrome.runtime.id !== undefined
      ) {
        // check if chrome.storage.local is available
        if (
          typeof _window.chrome.storage !== 'undefined' &&
          _window.chrome.storage.local !== undefined &&
          _window.chrome.storage.local.set !== undefined &&
          _window.chrome.storage.local.get !== undefined
        ) {
          this._chromeExtension = true;
        }
      }
    } else {
      throw new Error('Unknown environment');
    }
    this._signerStorageKey = `@elytro/keyvault:data-${tag}`;
  }

  // private async safeKey(str: string): Promise<string> {
  //     str = '@elytro/keyvault:' + str;
  //     // SHA-256
  //     const encoder = new TextEncoder();
  //     const data = encoder.encode(str);
  //     const digestBuffer = await window.crypto.subtle.digest('SHA-256', data);
  //     // to hex
  //     const digestArray = Array.from(new Uint8Array(digestBuffer));
  //     const digestHex = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');
  //     return digestHex;
  // }

  // private paddingTo1MB(data: string): Result<string, Error> {
  //     // padding to 1MB
  //     const MB = 1024 * 1024;
  //     const encoder = new TextEncoder();
  //     const len = encoder.encode(data).length;
  //     if (len > MB) {
  //         return new Err(new Error('data size over 1MB'));
  //     }
  //     const padding = ' '.repeat(MB - len);
  //     return new Ok(data + padding);
  // }

  public async load(defaultValue: string): Promise<Result<string, Error>> {
    try {
      const data = await this._read();
      if (data.isErr() === true) {
        return new Err(data.ERR);
      }
      if (data.OK === '') {
        return new Ok(defaultValue);
      }
      return new Ok(data.OK);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  public async save(value: string): Promise<Result<void, Error>> {
    try {
      const re = await this._save(value);
      if (re.isErr() === true) {
        return new Err(re.ERR);
      }
      return new Ok(void 0);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async _save(data: string): Promise<Result<void, Error>> {
    try {
      if (this._chromeExtension) {
        return await this.chromeStorageSet(data);
      } else {
        return await this.localStorageSet(data);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }
  private async _read(): Promise<Result<string, Error>> {
    try {
      let re;
      if (this._chromeExtension) {
        re = await this.chromeStorageGet();
      } else {
        re = await this.localStorageGet();
      }
      if (re.isErr() === true) {
        return new Err(re.ERR);
      }
      return new Ok(re.OK);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async localStorageSet(value: string): Promise<Result<void, Error>> {
    try {
      window.localStorage.setItem(this._signerStorageKey, value);
      return new Ok(void 0);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }
  private async localStorageGet(): Promise<Result<string, Error>> {
    try {
      const val = window.localStorage.getItem(this._signerStorageKey);
      if (typeof val === 'undefined' || val === null) {
        return new Ok('');
      }
      return new Ok(val);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private chromeStorageSet(value: string): Promise<Result<void, Error>> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _window = window as any;
      const storage = _window.chrome.storage.local;
      const obj: Record<string, string> = {};
      obj[this._signerStorageKey] = value;
      storage.set(obj, () => {
        if (_window.chrome.runtime.lastError !== undefined) {
          resolve(new Err(new Error(_window.chrome.runtime.lastError.message)));
        } else {
          resolve(new Ok(void 0));
        }
      });
    });
  }
  private chromeStorageGet(): Promise<Result<string, Error>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _window = window as any;
    const storage = _window.chrome.storage.local;
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage.get(this._signerStorageKey, (result: any) => {
        if (_window.chrome.runtime.lastError !== undefined) {
          resolve(new Err(new Error(_window.chrome.runtime.lastError.message)));
        } else {
          if (
            typeof result === 'object' &&
            typeof result[this._signerStorageKey] === 'string'
          ) {
            resolve(new Ok(result[this._signerStorageKey]));
          } else {
            resolve(new Ok(''));
          }
        }
      });
    });
  }

  public async selfDestruct(): Promise<Result<void, Error>> {
    try {
      if (this._chromeExtension) {
        await this.chromeStorageSet('');
      } else {
        window.localStorage.setItem(this._signerStorageKey, '');
      }
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
