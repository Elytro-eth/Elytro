// import walletClient from '../walletClient';
import { SafeEventEmitter } from '@/utils/safeEventEmitter';
import { Address, BlockTag, toHex } from 'viem';
import walletClient from '../services/walletClient';
import { ethErrors } from 'eth-rpc-errors';
import { rpcCacheManager } from '@/utils/cache/rpcCacheManager';
import accountManager from '../services/account';
import chainService from '../services/chain';

/**
 * Elytro Builtin Provider: based on EIP-1193
 */
class BuiltinProvider extends SafeEventEmitter {
  private _initialized: boolean = false;
  private _connected: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  public initialize = async () => {
    this._initialized = true;
    this._connected = true;
  };

  public get connected() {
    return this._connected;
  }

  public get initialized() {
    return this._initialized;
  }

  private _validateArrayParams(params: SafeAny, expectedLength: number = 1) {
    if (!Array.isArray(params) || params.length < expectedLength) {
      throw ethErrors.rpc.invalidParams();
    }
  }

  private async _request({ method, params }: RequestArguments) {
    switch (method) {
      case 'net_version':
        return chainService.currentChain?.id?.toString() ?? '0';
      case 'eth_chainId':
        return toHex(chainService.currentChain?.id ?? 0);
      case 'eth_blockNumber':
        return await walletClient.getBlockNumber();
      case 'eth_accounts':
      case 'eth_requestAccounts':
        return accountManager.currentAccount?.address
          ? [accountManager.currentAccount?.address]
          : [];
      case 'eth_getBlockByNumber':
        return await walletClient.getBlockByNumber({
          blockTag: (params as [BlockTag])?.[0] ?? 'latest',
          includeTransactions: (params as [BlockTag, false])?.[1],
        });

      // TODO: optimize this. maybe move the params validating to rpcFlow?
      case 'eth_getCode':
        this._validateArrayParams(params);

        return await walletClient.getCode(
          ...(params as [Address, BlockTag | bigint])
        );
      case 'eth_estimateGas':
        this._validateArrayParams(params);
        return await walletClient.estimateGas(
          ...(params as [SafeAny, BlockTag | bigint])
        );
      // case 'eth_getTransactionByHash':
      //   this._validateArrayParams(params);
      //   // return await walletClient.getTransactionReceipt((params as [Hex])[0]);
      //   return await walletClient.rpcRequest(method, params);
      default:
        return await walletClient.rpcRequest(method, params);
    }
  }

  public async request({ method, params }: RequestArguments) {
    const chainId = chainService.currentChain?.id ?? 0;
    const address = accountManager.currentAccount?.address ?? '0x';

    const cacheResult = rpcCacheManager.get(chainId, address, {
      method,
      params,
    });

    if (cacheResult) {
      return cacheResult;
    }

    const result = await this._request({ method, params });
    rpcCacheManager.set(chainId, address, { method, params }, result);

    return result;
  }
}

const builtinProvider = new BuiltinProvider();

export default builtinProvider;
