// import { v4 as UUIDv4 } from 'uuid';
// import { EIP5792Call, EIP5792CallTracking, EIP5792CallsStatus, EIP5792CallResult } from '@/types/eip5792';
// import eventBus from '@/utils/eventBus';
// import { EVENT_TYPES } from '@/constants/events';

// /**
//  * EIP-5792 Call Manager
//  * Manages batched calls and their status tracking
//  */
// class CallManager {
//   private _calls: Map<string, EIP5792CallTracking> = new Map();
//   private _maxCallsPerBatch = 10; // Limit for security
//   private _callTimeout = 5 * 60 * 1000; // 5 minutes timeout

//   /**
//    * Create a new batch of calls
//    */
//   public createCalls(calls: EIP5792Call[]): string {
//     if (calls.length === 0) {
//       throw new Error('No calls provided');
//     }

//     if (calls.length > this._maxCallsPerBatch) {
//       throw new Error(`Too many calls. Maximum ${this._maxCallsPerBatch} calls allowed per batch.`);
//     }

//     const callId = UUIDv4();
//     const tracking: EIP5792CallTracking = {
//       id: callId,
//       status: 'pending',
//       calls,
//       createdAt: Date.now(),
//     };

//     this._calls.set(callId, tracking);

//     // Set timeout for the call
//     setTimeout(() => {
//       this._timeoutCall(callId);
//     }, this._callTimeout);

//     console.log(`[EIP-5792] Created call batch with ID: ${callId}`, { calls });
//     return callId;
//   }

//   /**
//    * Get the status of a call batch
//    */
//   public getCallsStatus(callId: string): EIP5792CallsStatus {
//     const tracking = this._calls.get(callId);

//     if (!tracking) {
//       throw new Error('Call not found');
//     }

//     return {
//       status: tracking.status,
//       results: tracking.results,
//       error: tracking.error,
//     };
//   }

//   /**
//    * Update call status to completed with results
//    */
//   public completeCalls(callId: string, results: EIP5792CallResult[], userOpHash?: string, txHash?: string): void {
//     const tracking = this._calls.get(callId);

//     if (!tracking) {
//       console.error(`[EIP-5792] Call ${callId} not found for completion`);
//       return;
//     }

//     tracking.status = 'completed';
//     tracking.results = results;
//     tracking.completedAt = Date.now();
//     tracking.userOpHash = userOpHash;
//     tracking.txHash = txHash;

//     console.log(`[EIP-5792] Call batch ${callId} completed`, { results, userOpHash, txHash });

//     // Emit event for UI updates
//     eventBus.emit(EVENT_TYPES.EIP5792.CALLS_COMPLETED, { callId, results, userOpHash, txHash });
//   }

//   /**
//    * Update call status to failed with error
//    */
//   public failCalls(callId: string, error: string): void {
//     const tracking = this._calls.get(callId);

//     if (!tracking) {
//       console.error(`[EIP-5792] Call ${callId} not found for failure`);
//       return;
//     }

//     tracking.status = 'failed';
//     tracking.error = error;
//     tracking.completedAt = Date.now();

//     console.log(`[EIP-5792] Call batch ${callId} failed`, { error });

//     // Emit event for UI updates
//     eventBus.emit(EVENT_TYPES.EIP5792.CALLS_FAILED, { callId, error });
//   }

//   /**
//    * Get call tracking information
//    */
//   public getCallTracking(callId: string): EIP5792CallTracking | undefined {
//     return this._calls.get(callId);
//   }

//   /**
//    * Get all pending calls
//    */
//   public getPendingCalls(): EIP5792CallTracking[] {
//     return Array.from(this._calls.values()).filter((call) => call.status === 'pending');
//   }

//   /**
//    * Clean up old completed calls
//    */
//   public cleanupOldCalls(maxAge: number = 24 * 60 * 60 * 1000): void {
//     const now = Date.now();
//     const toDelete: string[] = [];

//     this._calls.forEach((tracking, callId) => {
//       if (tracking.status !== 'pending' && now - tracking.createdAt > maxAge) {
//         toDelete.push(callId);
//       }
//     });

//     toDelete.forEach((callId) => {
//       this._calls.delete(callId);
//     });

//     if (toDelete.length > 0) {
//       console.log(`[EIP-5792] Cleaned up ${toDelete.length} old calls`);
//     }
//   }

//   /**
//    * Timeout a call if it takes too long
//    */
//   private _timeoutCall(callId: string): void {
//     const tracking = this._calls.get(callId);

//     if (tracking && tracking.status === 'pending') {
//       this.failCalls(callId, 'Call timeout');
//     }
//   }

//   /**
//    * Validate calls before processing
//    */
//   public validateCalls(calls: EIP5792Call[]): void {
//     if (!Array.isArray(calls)) {
//       throw new Error('Calls must be an array');
//     }

//     if (calls.length === 0) {
//       throw new Error('At least one call is required');
//     }

//     if (calls.length > this._maxCallsPerBatch) {
//       throw new Error(`Too many calls. Maximum ${this._maxCallsPerBatch} calls allowed per batch.`);
//     }

//     calls.forEach((call, index) => {
//       if (!call.to || !call.data) {
//         throw new Error(`Call ${index} is missing required fields (to, data)`);
//       }

//       if (!call.to.startsWith('0x') || call.to.length !== 42) {
//         throw new Error(`Call ${index} has invalid 'to' address`);
//       }

//       if (!call.data.startsWith('0x')) {
//         throw new Error(`Call ${index} has invalid 'data' field`);
//       }

//       if (call.value && (!call.value.startsWith('0x') || call.value === '0x')) {
//         throw new Error(`Call ${index} has invalid 'value' field`);
//       }

//       if (call.gas && (!call.gas.startsWith('0x') || call.gas === '0x')) {
//         throw new Error(`Call ${index} has invalid 'gas' field`);
//       }
//     });
//   }

//   /**
//    * Get call statistics
//    */
//   public getStats(): { total: number; pending: number; completed: number; failed: number } {
//     const stats = { total: 0, pending: 0, completed: 0, failed: 0 };

//     this._calls.forEach((tracking) => {
//       stats.total++;
//       stats[tracking.status]++;
//     });

//     return stats;
//   }
// }

// const callManager = new CallManager();

// // Clean up old calls every hour
// setInterval(
//   () => {
//     callManager.cleanupOldCalls();
//   },
//   60 * 60 * 1000
// );

// export default callManager;
