import { WalletController } from '@/background/walletController';
import CacheManager from './cacheManager';

const DEFAULT_UI_REQ_CACHE_EXPIRE_TIME = 10_000; // ms

type TUIRequestMethod = keyof WalletController;

class ReqCacheManager extends CacheManager {
  static allowedMethods: TUIRequestMethod[] = [
    'getOwnerAddress',
    'getSmartAccountInfo',
  ];

  protected _getCacheKey(method: string, params: unknown[]): string {
    // if params is empty, use timestamp as key
    const paramsKey = params.length ? params.join('_') : new Date().getTime();
    return `${method}_${paramsKey}`;
  }

  public set(method: string, params: unknown[], res: unknown): void {
    if (!ReqCacheManager.allowedMethods.includes(method as TUIRequestMethod)) {
      return;
    }

    this._set(
      this._getCacheKey(method, params),
      res,
      DEFAULT_UI_REQ_CACHE_EXPIRE_TIME
    );
  }

  public get(method: string, params: unknown[]): SafeAny | null {
    if (!ReqCacheManager.allowedMethods.includes(method as TUIRequestMethod)) {
      return null;
    }

    return this._get(this._getCacheKey(method, params));
  }
}

const uiReqCacheManager = new ReqCacheManager();

export default uiReqCacheManager;
