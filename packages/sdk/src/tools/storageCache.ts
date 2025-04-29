class CachedData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public value: any;
  public expire: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(value: any, expire: number) {
    this.value = value;
    this.expire = expire;
  }
}
export class StorageCache {
  private static instance?: StorageCache = undefined;

  public static getInstance(): StorageCache {
    if (!StorageCache.instance) StorageCache.instance = new StorageCache();
    return StorageCache.instance!;
  }

  private storage: Record<string, CachedData> = {};
  private storageKey: string = 'elytrowallet-sdk-cache';
  private useLocalStorage: boolean = false;

  private constructor() {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      this.useLocalStorage = true;
    }
  }

  /**
   *
   *
   * @template T
   * @param {string} key
   * @param {T} value
   * @param {number} [expire=0] 0 means never expire, unit: second, default: 7 days
   * @memberof StorageCache
   */
  public set<T>(key: string, value: T, expire: number = 86400 * 7) {
    const k = this.storageKey + '|' + key;
    const v = new CachedData(
      value,
      expire === 0 ? 0 : Date.now() + expire * 1000
    );
    if (this.useLocalStorage) {
      window.localStorage.setItem(k, JSON.stringify(v));
    } else {
      this.storage[k] = v;
    }
  }

  /**
   *
   *
   * @template T
   * @param {string} key
   * @param {T} defaultValue
   * @return {*}  {T}
   * @memberof StorageCache
   */
  public get<T>(key: string, defaultValue: T): T {
    const k = this.storageKey + '|' + key;

    let v: CachedData | undefined = undefined;
    if (this.useLocalStorage) {
      const s = window.localStorage.getItem(k);
      if (s != null) {
        try {
          v = JSON.parse(s) as CachedData;
        } catch (error: unknown) {
          console.error(error);
        }
      }
    } else {
      if (k in this.storage) {
        v = this.storage[k];
      }
    }
    if (v) {
      if (v.expire === 0 || v.expire > Date.now()) {
        return v.value;
      }
    }

    return defaultValue;
  }
}
