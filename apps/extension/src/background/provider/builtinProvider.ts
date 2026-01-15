// import walletClient from '../walletClient';
import { SafeEventEmitter } from '@/utils/safeEventEmitter';
import { Address, BlockTag, toHex } from 'viem';
import walletClient from '../services/walletClient';
import { ethErrors } from 'eth-rpc-errors';
import { rpcCacheManager } from '@/utils/cache/rpcCacheManager';
import accountManager from '../services/account';
import chainService from '../services/chain';
// import callManager from '../services/callManager';
// import callManager from '../services/callManager';

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

  // private async _handleBatchedCalls(calls: EIP5792Call[]): Promise<EIP5792CallResult[]> {
  //   console.log('[EIP-5792] Processing batched calls:', calls);

  //   try {
  //     // Convert EIP-5792 calls to viem transactions
  //     const transactions = calls.map((call) => ({
  //       to: call.to as Address,
  //       data: call.data as `0x${string}`,
  //       value: call.value ? BigInt(call.value) : 0n,
  //       gas: call.gas ? BigInt(call.gas) : undefined,
  //     }));

  //     // Create user operation from transactions
  //     const currentAddress = accountManager.currentAccount?.address;
  //     if (!currentAddress) {
  //       throw new Error('No current account address');
  //     }
  //     const userOp = await walletClient.createUserOpFromTxs(currentAddress, transactions);

  //     // Sign and send the user operation
  //     const { opHash } = await walletClient.signUserOperation(userOp);
  //     const txHash = await walletClient.sendUserOperation(userOp);

  //     // Simulate the calls to get results
  //     const results: EIP5792CallResult[] = [];

  //     for (let i = 0; i < calls.length; i++) {
  //       try {
  //         // Simulate each call to get the return data
  //         const result = await walletClient.simulateUserOperation(userOp);
  //         results.push({
  //           status: 'success',
  //           returnData: result?.returnData || '0x',
  //         });
  //       } catch (error) {
  //         results.push({
  //           status: 'failure',
  //           error: error instanceof Error ? error.message : 'Unknown error',
  //         });
  //       }
  //     }

  //     console.log('[EIP-5792] Batched calls completed:', { opHash, txHash, results });
  //     return results;
  //   } catch (error) {
  //     console.error('[EIP-5792] Error processing batched calls:', error);
  //     throw error;
  //   }
  // }

  private async _request({ method, params }: RequestArguments) {
    switch (method) {
      case 'net_version':
        return chainService.currentChain?.id?.toString() ?? '0';
      case 'eth_chainId':
        return toHex(chainService.currentChain?.id ?? 0);
      case 'eth_blockNumber':
        return toHex(await walletClient.getBlockNumber());
      case 'eth_accounts':
      case 'eth_requestAccounts':
        return accountManager.currentAccount?.address ? [accountManager.currentAccount?.address] : [];
      case 'eth_getBlockByNumber':
        return await walletClient.getBlockByNumber({
          blockTag: (params as [BlockTag])?.[0] ?? 'latest',
          includeTransactions: (params as [BlockTag, false])?.[1],
        });

      // TODO: optimize this. maybe move the params validating to rpcFlow?
      case 'eth_getCode':
        this._validateArrayParams(params);

        return await walletClient.getCode(...(params as [Address, BlockTag | bigint]));
      case 'eth_estimateGas':
        this._validateArrayParams(params);
        return await walletClient.estimateGas(...(params as [SafeAny, BlockTag | bigint]));
      // case 'wallet_sendCalls': {
      //   // EIP-5792
      //   console.log('[EIP-5792] wallet_sendCalls', params);
      //   const calls: EIP5792Call[] = params?.[0]?.calls || params;

      //   if (!Array.isArray(calls) || calls.length === 0) {
      //     throw ethErrors.rpc.invalidParams('Calls must be a non-empty array');
      //   }

      //   // Validate calls
      //   callManager.validateCalls(calls);

      //   // Create call tracking
      //   const callsId = callManager.createCalls(calls);

      //   // Process calls asynchronously using EIP5792Service
      //   eip5792Service.processCalls(callsId, calls);

      //   return callsId;
      // }

      // case 'wallet_getCallsStatus': {
      //   console.log('[EIP-5792] wallet_getCallsStatus', params);
      //   const statusId = params?.[0] as string;
      //   if (!statusId) {
      //     throw ethErrors.rpc.invalidParams('Call ID is required');
      //   }
      //   return callManager.getCallsStatus(statusId);
      // }

      // case 'wallet_showCallsStatus': {
      //   console.log('[EIP-5792] wallet_showCallsStatus', params);
      //   const showId = params?.[0] as string;
      //   if (!showId) {
      //     throw ethErrors.rpc.invalidParams('Call ID is required');
      //   }

      //   const status = callManager.getCallsStatus(showId);
      //   const tracking = callManager.getCallTracking(showId);

      //   console.log('[EIP-5792] Calls Status:', {
      //     callId: showId,
      //     status: status.status,
      //     results: status.results,
      //     error: status.error,
      //     userOpHash: tracking?.userOpHash,
      //     txHash: tracking?.txHash,
      //   });

      //   return null;
      // }
      case 'wallet_requestPermissions':
        console.log('wallet_requestPermissions', params);
        // Return basic permissions that are typically requested
        return [
          {
            parentCapability: 'eth_accounts',
            date: new Date().getTime(),
            invoker: window.location.origin,
            caveats: [],
          },
        ];
      case 'wallet_getCapabilities': {
        const currentChainId = chainService.currentChain?.id;
        const chainIdHex = currentChainId ? toHex(currentChainId) : '0x1';

        return {
          [chainIdHex]: {
            atomic: {
              status: 'ready',
            },
            atomicBatch: {
              supported: true,
            },
            auxiliaryFunds: {
              supported: true,
            },
            paymasterService: {
              supported: true,
            },
          },
        };
      }
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
