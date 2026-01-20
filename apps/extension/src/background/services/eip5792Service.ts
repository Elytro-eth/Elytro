// import { EIP5792Call, EIP5792CallResult } from '@/types/eip5792';
// import callManager from './callManager';
// import { elytroSDK } from './sdk';
// import accountManager from './account';
// import { Transaction } from '@elytro/sdk';
// import { Address } from 'viem';
// import eventBus from '@/utils/eventBus';
// import { EVENT_TYPES } from '@/constants/events';

// /**
//  * EIP-5792 Service
//  * Handles integration between EIP-5792 calls and existing transaction system
//  */
// class EIP5792Service {
//   /**
//    * Process EIP-5792 calls and convert them to user operations
//    */
//   public async processCalls(callId: string, calls: EIP5792Call[]): Promise<void> {
//     try {
//       console.log(`[EIP-5792] Processing calls for ${callId}:`, calls);

//       // Convert EIP-5792 calls to viem transactions
//       const transactions = this.convertCallsToTransactions(calls);

//       // Create user operation from transactions
//       const currentAddress = accountManager.currentAccount?.address;
//       if (!currentAddress) {
//         throw new Error('No current account address');
//       }
//       const userOp = await elytroSDK.createUserOpFromTxs(currentAddress, transactions);

//       // Estimate gas for the user operation
//       const estimatedUserOp = await elytroSDK.estimateGas(userOp);

//       // Sign the user operation
//       const { opHash } = await elytroSDK.signUserOperation(estimatedUserOp);

//       // Send the user operation
//       const txHash = await elytroSDK.sendUserOperation(estimatedUserOp);

//       // Simulate calls to get results
//       const results = await this.simulateCalls(calls, estimatedUserOp);

//       // Complete the calls
//       callManager.completeCalls(callId, results, opHash, txHash);

//       // Add to history
//       this.addToHistory(callId, estimatedUserOp, results, opHash);

//       console.log(`[EIP-5792] Calls ${callId} completed successfully`, {
//         opHash,
//         txHash,
//         results,
//       });
//     } catch (error) {
//       console.error(`[EIP-5792] Error processing calls ${callId}:`, error);
//       callManager.failCalls(callId, error instanceof Error ? error.message : 'Unknown error');
//     }
//   }

//   /**
//    * Convert EIP-5792 calls to viem transactions
//    */
//   private convertCallsToTransactions(calls: EIP5792Call[]): Transaction[] {
//     return calls.map((call) => ({
//       to: call.to as Address,
//       data: call.data as `0x${string}`,
//       value: call.value ? BigInt(call.value) : 0n,
//       gasLimit: call.gas ? BigInt(call.gas) : undefined,
//     }));
//   }

//   /**
//    * Simulate calls to get return data
//    */
//   private async simulateCalls(calls: EIP5792Call[], userOp: ElytroUserOperation): Promise<EIP5792CallResult[]> {
//     const results: EIP5792CallResult[] = [];

//     for (let i = 0; i < calls.length; i++) {
//       try {
//         // Simulate the user operation to get return data
//         const simulation = await elytroSDK.simulateUserOperation(userOp);

//         // Extract return data for this specific call
//         const returnData = this.extractReturnData(simulation, i);

//         results.push({
//           status: 'success',
//           returnData: returnData || '0x',
//         });
//       } catch (error) {
//         console.error(`[EIP-5792] Simulation failed for call ${i}:`, error);
//         results.push({
//           status: 'failure',
//           error: error instanceof Error ? error.message : 'Simulation failed',
//         });
//       }
//     }

//     return results;
//   }

//   /**
//    * Extract return data from simulation result
//    */
//   private extractReturnData(simulation: SafeAny, _callIndex: number): string {
//     // This is a simplified implementation
//     // In a real implementation, you would need to parse the simulation result
//     // to extract the return data for each specific call
//     return simulation?.returnData || '0x';
//   }

//   /**
//    * Add EIP-5792 calls to transaction history
//    */
//   private addToHistory(
//     callId: string,
//     userOp: ElytroUserOperation,
//     results: EIP5792CallResult[],
//     opHash: string
//   ): void {
//     try {
//       // Create a history entry for the batched calls
//       const historyEntry = {
//         timestamp: Date.now(),
//         from: userOp.sender,
//         to: 'Multiple Contracts', // Since it's a batch
//         method: 'Batch Call' as string,
//         value: '0', // Will be calculated from individual calls
//         decimals: 18,
//         symbol: 'ETH',
//         logoURI: '',
//         opHash,
//         status: 'pending' as string,
//         type: 'ContractInteract' as string,
//         approvalId: callId,
//       };

//       // Emit event to add to history
//       eventBus.emit(EVENT_TYPES.HISTORY.NEW_RECEIVED_MESSAGE, {
//         type: 'EIP5792_BATCH',
//         data: {
//           callId,
//           userOp,
//           results,
//           historyEntry,
//         },
//       });
//     } catch (error) {
//       console.error('[EIP-5792] Error adding to history:', error);
//     }
//   }

//   /**
//    * Get call statistics
//    */
//   public getCallStats(): SafeAny {
//     return callManager.getStats();
//   }

//   /**
//    * Clean up old calls
//    */
//   public cleanupOldCalls(): void {
//     callManager.cleanupOldCalls();
//   }
// }

// const eip5792Service = new EIP5792Service();

// export default eip5792Service;
