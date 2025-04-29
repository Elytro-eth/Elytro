export class MemCache {
  private static instance?: MemCache = undefined;

  public static getInstance(): MemCache {
    if (!MemCache.instance) MemCache.instance = new MemCache();
    return MemCache.instance!;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private storage: Record<string, any> = {};

  private constructor() {}

  /**
   *
   *
   * @template T
   * @param {string} key
   * @param {T} value
   */
  public set<T>(key: string, value: T) {
    if (value === undefined) {
      throw new Error('value is undefined');
    }
    this.storage[key] = value;
  }

  /**
   *
   *
   * @template T
   * @param {string} key
   * @param {T} defaultValue
   * @return {*}  {T}
   */
  public get<T>(key: string, defaultValue: T): T {
    if (key in this.storage) {
      const v = this.storage[key] as T;
      if (v !== undefined) {
        return v;
      }
    }
    return defaultValue;
  }
}
