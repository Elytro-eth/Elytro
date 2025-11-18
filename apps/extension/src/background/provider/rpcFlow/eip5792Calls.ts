// import { approvalService, ApprovalTypeEn } from '@/background/services/approval';
// import callManager from '@/background/services/callManager';
// import { EIP5792Call } from '@/types/eip5792';
// import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
// import { ethErrors } from 'eth-rpc-errors';

// const EIP5792_METHODS: ProviderMethodType[] = [
//   'wallet_sendCalls',
//   'wallet_getCallsStatus',
//   'wallet_showCallsStatus',
//   'wallet_getCapabilities',
// ];

// /**
//  * EIP-5792 Calls Middleware
//  * Handles batched calls according to EIP-5792 specification
//  */
// export const eip5792Calls: TFlowMiddleWareFn = async (ctx, next) => {
//   const { rpcReq, dApp } = ctx.request;
//   const { method, params } = rpcReq;

//   // Only handle EIP-5792 methods
//   if (!EIP5792_METHODS.includes(method)) {
//     return next();
//   }

//   switch (method) {
//     case 'wallet_sendCalls':
//       return await handleSendCalls(params, dApp);

//     case 'wallet_getCallsStatus':
//       return await handleGetCallsStatus(params);

//     case 'wallet_showCallsStatus':
//       return await handleShowCallsStatus(params);

//     case 'wallet_getCapabilities':
//       return await handleGetCapabilities();

//     default:
//       return next();
//   }
// };

// /**
//  * Handle wallet_sendCalls method
//  */
// async function handleSendCalls(params: SafeAny, dApp: TDAppInfo): Promise<string> {
//   if (!params || !Array.isArray(params) || params.length === 0) {
//     throw ethErrors.rpc.invalidParams('Invalid calls parameter');
//   }

//   const calls: EIP5792Call[] = params[0]?.calls || params;

//   if (!Array.isArray(calls) || calls.length === 0) {
//     throw ethErrors.rpc.invalidParams('Calls must be a non-empty array');
//   }

//   try {
//     // Validate calls
//     callManager.validateCalls(calls);

//     // Create call tracking
//     const callId = callManager.createCalls(calls);

//     // Request approval for the batched calls
//     await approvalService.request(ApprovalTypeEn.EIP5792Calls, {
//       dApp,
//       calls,
//       callId,
//     });

//     return callId;
//   } catch (error) {
//     console.error('[EIP-5792] Error in handleSendCalls:', error);
//     throw ethErrors.rpc.internal('Failed to process calls');
//   }
// }

// /**
//  * Handle wallet_getCallsStatus method
//  */
// async function handleGetCallsStatus(params: SafeAny): Promise<SafeAny> {
//   if (!params || !Array.isArray(params) || params.length === 0) {
//     throw ethErrors.rpc.invalidParams('Call ID is required');
//   }

//   const callId = params[0];

//   if (typeof callId !== 'string') {
//     throw ethErrors.rpc.invalidParams('Call ID must be a string');
//   }

//   try {
//     return callManager.getCallsStatus(callId);
//   } catch (error) {
//     console.error('[EIP-5792] Error in handleGetCallsStatus:', error);
//     throw ethErrors.rpc.internal('Failed to get calls status');
//   }
// }

// /**
//  * Handle wallet_showCallsStatus method
//  */
// async function handleShowCallsStatus(params: SafeAny): Promise<null> {
//   if (!params || !Array.isArray(params) || params.length === 0) {
//     throw ethErrors.rpc.invalidParams('Call ID is required');
//   }

//   const callId = params[0];

//   if (typeof callId !== 'string') {
//     throw ethErrors.rpc.invalidParams('Call ID must be a string');
//   }

//   try {
//     const status = callManager.getCallsStatus(callId);
//     const tracking = callManager.getCallTracking(callId);

//     console.log(`[EIP-5792] Showing calls status for ${callId}:`, {
//       status: status.status,
//       results: status.results,
//       error: status.error,
//       userOpHash: tracking?.userOpHash,
//       txHash: tracking?.txHash,
//     });

//     // This method is for UI display, return null as per spec
//     return null;
//   } catch (error) {
//     console.error('[EIP-5792] Error in handleShowCallsStatus:', error);
//     throw ethErrors.rpc.internal('Failed to show calls status');
//   }
// }

// /**
//  * Handle wallet_getCapabilities method
//  */
// async function handleGetCapabilities(): Promise<SafeAny> {
//   // Return capabilities for supported chains
//   return {
//     '0x1': {
//       // Ethereum mainnet
//       atomic: {
//         status: 'ready',
//       },
//       atomicBatch: {
//         supported: true,
//       },
//       auxiliaryFunds: {
//         supported: true,
//       },
//       paymasterService: {
//         supported: true,
//       },
//     },
//     '0xa': {
//       // Optimism
//       atomic: {
//         status: 'ready',
//       },
//       atomicBatch: {
//         supported: true,
//       },
//       auxiliaryFunds: {
//         supported: true,
//       },
//       paymasterService: {
//         supported: true,
//       },
//     },
//     '0xa4b1': {
//       // Arbitrum
//       atomic: {
//         status: 'ready',
//       },
//       atomicBatch: {
//         supported: true,
//       },
//       auxiliaryFunds: {
//         supported: true,
//       },
//       paymasterService: {
//         supported: true,
//       },
//     },
//   };
// }
