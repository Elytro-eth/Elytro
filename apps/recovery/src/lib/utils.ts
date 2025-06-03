import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BlockTag, GetLogsParameters, GetLogsReturnType, PublicClient } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MIN_STEP = 100n;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 20_000; // 20 seconds timeout

type GetLogsOnchainArgs = GetLogsParameters<SafeAny, SafeAny, SafeAny, SafeAny, SafeAny, SafeAny>;
type GetLogsOnchainReturnType = GetLogsReturnType<SafeAny, SafeAny, SafeAny, SafeAny, SafeAny, SafeAny, SafeAny>;

export const getLogsOnchain = async (
  client: PublicClient,
  args: GetLogsOnchainArgs
): Promise<GetLogsOnchainReturnType> => {
  const { fromBlock, toBlock, ...rest } = args;

  // if fromBlock/toBlock number is BlockTag, we don't need to adjust them
  if (typeof fromBlock === 'string' || typeof toBlock === 'string') {
    return await client.getLogs(args);
  }

  let _fromBlock = fromBlock ? BigInt(fromBlock) : 0n;
  const _latestBlock = await client.getBlockNumber();
  let step = 3000n;
  let retryCount = 0;
  const startTime = Date.now();

  const _getLogs = async (from: bigint, to: bigint | BlockTag) => {
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('getLogsOnchain timeout');
    }

    return await client.getLogs({
      ...rest,
      fromBlock: from,
      toBlock: to,
    } as GetLogsOnchainArgs);
  };

  try {
    while (_fromBlock <= _latestBlock) {
      const _toBlock = _fromBlock + step > _latestBlock ? _latestBlock : _fromBlock + step;

      try {
        const logs = await _getLogs(_fromBlock, _toBlock);
        if (logs.length > 0) {
          return logs;
        }
        _fromBlock = _toBlock + 1n;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('block range is too large')) {
            step = step / 2n;
            if (step < MIN_STEP) {
              console.warn('Step size too small, stopping search');
              break;
            }
            continue; // Retry with smaller step
          }

          // Handle other errors
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.error('Max retries reached:', error);
            throw error;
          }
          console.warn(`Retry ${retryCount}/${MAX_RETRIES} due to:`, error);
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('getLogsOnchain failed:', error);
    throw error;
  }

  return [];
};
