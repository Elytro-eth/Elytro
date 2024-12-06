import { SupportedChainTypeEn } from '@/constants/chains';
import CacheManager from '@/utils/cache/cacheManager';

const DEFAULT_BLOCK_NUMBER_CACHE_EXPIRE_TIME = 10_000; // ms
const DEFAULT_RPC_CACHE_EXPIRE_TIME = 30_000; //ms

// TODO: check if it's safe to cache these methods. And add more if needed.
const SAFE_CACHE_METHODS = [
  'eth_getCode',
  'eth_estimateGas',
  'eth_chainId',
  'eth_blockNumber',
  'eth_accounts',
  'eth_requestAccounts',
  'eth_getBlockByNumber',
  'eth_gasPrice',
  'eth_call',
];

class RPCCacheManager extends CacheManager {
  private _latestBlockNumberByChain: Record<string, string> = {}; // key is SupportedChainTypeEn

  public init() {
    this._refreshLatestBlockNumber();

    setInterval(() => {
      this._refreshLatestBlockNumber();
    }, DEFAULT_BLOCK_NUMBER_CACHE_EXPIRE_TIME);
  }

  private _refreshLatestBlockNumber() {
    for (const chain in SupportedChainTypeEn) {
      if (Object.prototype.hasOwnProperty.call(SupportedChainTypeEn, chain)) {
        this._latestBlockNumberByChain[chain as SupportedChainTypeEn] =
          Date.now().toString();
      }
    }
  }

  private _getLatestBlockNumber(chain: number) {
    return this._latestBlockNumberByChain[chain] ?? 0;
  }

  protected _getCacheKey(
    chainId: number,
    address: string,
    method: string,
    params: SafeAny
  ): string {
    return `${chainId}-${this._getLatestBlockNumber(chainId)}-${address}-${method}-${JSON.stringify(params)}`;
  }

  public set(
    chainId: number,
    address: string,
    request: RequestArguments,
    result: SafeAny,
    expireTime = DEFAULT_RPC_CACHE_EXPIRE_TIME
  ): void {
    if (
      result === null ||
      result === undefined ||
      !SAFE_CACHE_METHODS.includes(request.method)
    ) {
      return;
    }

    const key = this._getCacheKey(
      chainId,
      address,
      request.method,
      request.params
    );

    const cacheValue = this._cache.get(key);

    if (cacheValue) {
      clearTimeout(cacheValue.timeoutId);
    }

    this._set(key, result, expireTime);
  }

  public get(
    chainId: number,
    address: string,
    request: RequestArguments
  ): SafeAny | null {
    if (!SAFE_CACHE_METHODS.includes(request.method)) {
      return null;
    }

    const key = this._getCacheKey(
      chainId,
      address,
      request.method,
      request.params
    );

    return super._get(key);
  }
}

export const rpcCacheManager = new RPCCacheManager();
