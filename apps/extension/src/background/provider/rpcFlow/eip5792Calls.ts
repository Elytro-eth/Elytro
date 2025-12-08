import { approvalService, ApprovalTypeEn } from '@/background/services/approval';
import callManager from '@/background/services/callManager';
import { EIP5792Call, EIP5792CallsStatus, EIP5792Capabilities } from '@/types/eip5792';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import { ethErrors } from 'eth-rpc-errors';
import { elytroSDK } from '@/background/services/sdk';
import accountManager from '@/background/services/account';
import type { TProviderRequest } from './index';
import type { Transaction } from '@elytro/sdk';
import type { Address } from 'viem';

const EIP5792_METHODS: ProviderMethodType[] = [
  'wallet_sendCalls',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
  'wallet_getCapabilities',
];

export const eip5792Calls: TFlowMiddleWareFn = async (ctx, next) => {
  const { rpcReq, dApp } = ctx.request;
  const { method, params } = rpcReq;

  // Only handle EIP-5792 methods
  if (!EIP5792_METHODS.includes(method)) {
    return next();
  }

  switch (method) {
    case 'wallet_sendCalls':
      return await handleSendCalls(params, dApp);

    case 'wallet_getCallsStatus':
      return await handleGetCallsStatus(params);

    case 'wallet_showCallsStatus':
      return await handleShowCallsStatus(params);

    case 'wallet_getCapabilities':
      return await handleGetCapabilities(ctx.request);

    default:
      return next();
  }
};

async function handleSendCalls(params: SafeAny, dApp: TDAppInfo): Promise<{ id: string }> {
  if (!params || !Array.isArray(params) || params.length === 0) {
    throw ethErrors.rpc.invalidParams('Invalid calls parameter');
  }

  const calls: EIP5792Call[] = params[0]?.calls || params;

  if (!Array.isArray(calls) || calls.length === 0) {
    throw ethErrors.rpc.invalidParams('Calls must be a non-empty array');
  }

  try {
    callManager.validateCalls(calls);

    const callId = callManager.createCalls(calls);

    const transactions: Transaction[] = calls.map((call) => ({
      to: call.to as Address,
      data: call.data as `0x${string}`,
      value: call.value || '0x0',
      gasLimit: call.gas,
    }));

    await approvalService.request(ApprovalTypeEn.TxConfirm, {
      dApp,
      tx: transactions as SafeAny, // Convert to TTransactionInfo[] format
      callId, // Store callId for EIP-5792 tracking
    });

    return { id: callId };
  } catch (error) {
    console.error('[EIP-5792] Error in handleSendCalls:', error);
    throw ethErrors.rpc.internal('Failed to process calls');
  }
}

async function handleGetCallsStatus(params: SafeAny): Promise<EIP5792CallsStatus> {
  if (!params || !Array.isArray(params) || params.length === 0) {
    throw ethErrors.rpc.invalidParams('Call ID is required');
  }

  const callId = params[0];
  if (typeof callId !== 'string') {
    throw ethErrors.rpc.invalidParams('Call ID must be a string');
  }

  try {
    const tracking = callManager.getCallTracking(callId);
    if (!tracking) {
      throw new Error('Call not found');
    }

    if (!tracking.userOpHash) {
      return {
        status: 100, // Pending
        atomic: true,
        id: callId,
      };
    }

    try {
      const receiptResult = await elytroSDK.getUserOperationReceiptFull(tracking.userOpHash);

      if (!receiptResult) {
        // No receipt yet - still pending
        return {
          status: 100, // Pending
          atomic: true,
          id: callId,
        };
      }

      if ((receiptResult as SafeAny).error) {
        return {
          status: 400, // Failed offchain
          atomic: true,
          id: callId,
        };
      }

      const userOpReceipt = receiptResult as SafeAny;
      const isSuccess = userOpReceipt.success;

      if (tracking.status === 'pending') {
        const results = tracking.calls.map(() => ({
          status: (isSuccess ? 'success' : 'failure') as 'success' | 'failure',
          returnData: '0x' as `0x${string}`, // Would need to extract from receipt logs
        }));

        callManager.completeCalls(callId, results, tracking.userOpHash, userOpReceipt.receipt?.transactionHash);
      }

      return {
        status: isSuccess ? 200 : 500, // 200 = Confirmed, 500 = Reverted
        atomic: true,
        id: callId,
        receipts: [
          {
            logs: userOpReceipt.logs || [],
            status: isSuccess ? ('0x1' as `0x${string}`) : ('0x0' as `0x${string}`),
            blockHash: userOpReceipt.receipt?.blockHash,
            blockNumber: userOpReceipt.receipt?.blockNumber?.toString(),
            gasUsed: userOpReceipt.actualGasUsed?.toString(),
            transactionHash: userOpReceipt.receipt?.transactionHash,
          },
        ],
      };
    } catch (error) {
      console.error('[EIP-5792] Error getting receipt:', error);
      if (tracking.status === 'completed') {
        const receipt = await elytroSDK.getUserOperationReceipt(tracking.userOpHash);
        if (receipt) {
          return {
            status: receipt.success ? 200 : 500,
            atomic: true,
            id: callId,
            receipts: [
              {
                logs: (receipt as SafeAny).logs || [],
                status: receipt.success ? ('0x1' as `0x${string}`) : ('0x0' as `0x${string}`),
                blockHash: (receipt as SafeAny).blockHash,
                blockNumber: (receipt as SafeAny).blockNumber?.toString(),
                gasUsed: (receipt as SafeAny).gasUsed?.toString(),
                transactionHash: (receipt as SafeAny).transactionHash,
              },
            ],
          };
        }
      }

      return {
        status: 100, // Pending
        atomic: true,
        id: callId,
      };
    }
  } catch (error) {
    console.error('[EIP-5792] Error in handleGetCallsStatus:', error);
    throw ethErrors.rpc.internal('Failed to get calls status');
  }
}

async function handleShowCallsStatus(params: SafeAny): Promise<null> {
  if (!params || !Array.isArray(params) || params.length === 0) {
    throw ethErrors.rpc.invalidParams('Call ID is required');
  }

  const callId = params[0];
  if (typeof callId !== 'string') {
    throw ethErrors.rpc.invalidParams('Call ID must be a string');
  }

  try {
    const status = callManager.getCallsStatus(callId);
    const tracking = callManager.getCallTracking(callId);

    console.log(`[EIP-5792] Showing calls status for ${callId}:`, {
      status: status.status,
      results: status.results,
      error: status.error,
      userOpHash: tracking?.userOpHash,
      txHash: tracking?.txHash,
    });

    return null;
  } catch (error) {
    console.error('[EIP-5792] Error in handleShowCallsStatus:', error);
    throw ethErrors.rpc.internal('Failed to show calls status');
  }
}

async function handleGetCapabilities(_request: TProviderRequest): Promise<Record<string, EIP5792Capabilities>> {
  const chainId = accountManager.currentAccount?.chainId;
  const chainIdHex = chainId ? `0x${chainId.toString(16)}` : '0x0';

  const capabilities: EIP5792Capabilities = {
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
  };

  return {
    '0x0': capabilities,
    [chainIdHex]: capabilities,
  };
}
