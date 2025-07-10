// // query log from chain. dynamically adjust the block range to query the log. from latest block to start block(if has one, otherwise start from 0)

// import { AbiEvent, Address, PublicClient, Log } from 'viem';

// const MIN_STEP = 100n;
// const MAX_RETRIES = 3;
// const TIMEOUT_MS = 30_000; // 30 seconds timeout
// const DEFAULT_BLOCK_RANGE = 3000;

// export const queryLog = async (
//   client: PublicClient,
//   {
//     address,
//     event,
//     fromBlock,
//     toBlock,
//     blockRange = DEFAULT_BLOCK_RANGE,
//   }: {
//     address: Address;
//     event: AbiEvent;
//     fromBlock?: bigint;
//     toBlock?: bigint;
//     blockRange?: number;
//   }
// ): Promise<Log[]> => {
//   const startTime = Date.now();
//   const allLogs: Log[] = [];

//   // Get the current latest block if toBlock is not provided
//   const _latestBlock = toBlock ?? (await client.getBlockNumber());

//   // Calculate the starting block
//   const _startBlock = fromBlock ?? (_latestBlock - BigInt(blockRange) > 0n ? _latestBlock - BigInt(blockRange) : 0n);

//   let _fromBlock = _startBlock;
//   let step = BigInt(blockRange);
//   let retryCount = 0;

//   const _getLogs = async (from: bigint, to: bigint) => {
//     // Check for timeout
//     if (Date.now() - startTime > TIMEOUT_MS) {
//       throw new Error('queryLog timeout');
//     }

//     return await client.getLogs({
//       address,
//       event,
//       fromBlock: from,
//       toBlock: to,
//     });
//   };

//   console.log(`[queryLog] Starting query from block ${_fromBlock} to ${_latestBlock}, initial step: ${step}`);

//   try {
//     while (_fromBlock <= _latestBlock) {
//       const _toBlock = _fromBlock + step > _latestBlock ? _latestBlock : _fromBlock + step;

//       try {
//         const logs = await _getLogs(_fromBlock, _toBlock);

//         if (logs.length > 0) {
//           allLogs.push(...logs);
//           console.log(`[queryLog] Found ${logs.length} logs in range ${_fromBlock}-${_toBlock}`);
//         }

//         // Move to next chunk
//         _fromBlock = _toBlock + 1n;

//         // Reset retry count on successful query
//         retryCount = 0;
//       } catch (error) {
//         if (error instanceof Error) {
//           // Handle "block range is too large" error by reducing step size
//           if (
//             error.message.includes('block range is too large') ||
//             error.message.includes('query returned more than') ||
//             error.message.includes('response size exceeded')
//           ) {
//             step = step / 2n;

//             if (step < MIN_STEP) {
//               console.warn(`[queryLog] Step size too small (${step}), stopping search at block ${_fromBlock}`);
//               break;
//             }

//             console.log(`[queryLog] Reducing step size to ${step} due to large block range error`);
//             continue; // Retry with smaller step
//           }

//           // Handle other errors with retry mechanism
//           retryCount++;
//           if (retryCount >= MAX_RETRIES) {
//             console.error(`[queryLog] Max retries reached at block ${_fromBlock}:`, error);
//             throw error;
//           }

//           console.warn(
//             `[queryLog] Retry ${retryCount}/${MAX_RETRIES} for block range ${_fromBlock}-${_toBlock} due to:`,
//             error.message
//           );

//           // Exponential backoff
//           await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
//           continue;
//         }

//         throw error;
//       }
//     }
//   } catch (error) {
//     console.error('[queryLog] Query failed:', error);
//     throw error;
//   }

//   console.log(`[queryLog] Query completed. Total logs found: ${allLogs.length}`);

//   return allLogs;
// };
