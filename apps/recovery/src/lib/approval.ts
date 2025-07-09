import { createPublicClient, http, parseAbiItem, Address } from 'viem';
import { SUPPORTED_CHAINS } from '@/constants/chains';

const ERC20_APPROVAL_EVENT = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
);

const ERC20_ALLOWANCE_ABI = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

const ERC20_TOKEN_INFO_ABI = [
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

export interface ERC20Approval {
  token: Address;
  spender: Address;
  allowance: bigint;
  tokenInfo?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  lastUpdated?: {
    blockNumber: bigint;
    timestamp: number;
  };
}

interface QueryOptions {
  chainId: number;
  customRpc?: string;
  fromBlock?: bigint;
  includeTokenInfo?: boolean;
  blockRange?: number;
}

function getCurrentRpc(chainId: number, customRpc?: string): string {
  if (customRpc) return customRpc;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('custom_rpc_url' + chainId);
    if (stored) return stored;
  }

  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
  return chain?.rpcUrls.default.http[0] || '';
}

export async function queryErc20Approvals(address: Address, options: QueryOptions): Promise<ERC20Approval[]> {
  const { chainId, customRpc, fromBlock, includeTokenInfo = false, blockRange = 10000 } = options;

  const rpcUrl = getCurrentRpc(chainId, customRpc);
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);

  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const currentBlock = await client.getBlockNumber();
  const startBlock = fromBlock || currentBlock - BigInt(blockRange);

  try {
    const approvalLogs = await client.getLogs({
      event: ERC20_APPROVAL_EVENT,
      args: {
        owner: address,
      },
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    const approvalMap = new Map<
      string,
      {
        token: Address;
        spender: Address;
        blockNumber: bigint;
        timestamp?: number;
      }
    >();

    for (const log of approvalLogs) {
      if (!log.args.spender || !log.address) continue;

      const key = `${log.address}-${log.args.spender}`;
      const existing = approvalMap.get(key);

      if (!existing || log.blockNumber > existing.blockNumber) {
        approvalMap.set(key, {
          token: log.address as Address,
          spender: log.args.spender,
          blockNumber: log.blockNumber,
        });
      }
    }

    const approvals: ERC20Approval[] = [];

    for (const approval of approvalMap.values()) {
      try {
        const allowance = await client.readContract({
          address: approval.token,
          abi: ERC20_ALLOWANCE_ABI,
          functionName: 'allowance',
          args: [address, approval.spender],
        });

        if (allowance > 0n) {
          const approvalItem: ERC20Approval = {
            token: approval.token,
            spender: approval.spender,
            allowance,
            lastUpdated: {
              blockNumber: approval.blockNumber,
              timestamp: approval.timestamp || 0,
            },
          };

          if (includeTokenInfo) {
            try {
              const [name, symbol, decimals] = await Promise.all([
                client.readContract({
                  address: approval.token,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'name',
                }),
                client.readContract({
                  address: approval.token,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'symbol',
                }),
                client.readContract({
                  address: approval.token,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'decimals',
                }),
              ]);

              approvalItem.tokenInfo = {
                name: name as string,
                symbol: symbol as string,
                decimals: decimals as number,
              };
            } catch (error) {
              console.warn(`Failed to fetch token info for ${approval.token}:`, error);
              // Continue without token info
            }
          }

          approvals.push(approvalItem);
        }
      } catch (error) {
        console.warn(`Failed to check allowance for ${approval.token} -> ${approval.spender}:`, error);
      }
    }

    return approvals;
  } catch (error) {
    console.error('Error querying ERC20 approvals:', error);
    throw new Error(`Failed to query ERC20 approvals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function queryErc20ApprovalsForToken(
  address: Address,
  tokenAddress: Address,
  options: QueryOptions
): Promise<ERC20Approval[]> {
  const { chainId, customRpc } = options;

  const rpcUrl = getCurrentRpc(chainId, customRpc);
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);

  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  try {
    const currentBlock = await client.getBlockNumber();
    const startBlock = options.fromBlock || currentBlock - BigInt(options.blockRange || 10000);

    const approvalLogs = await client.getLogs({
      address: tokenAddress,
      event: ERC20_APPROVAL_EVENT,
      args: {
        owner: address,
      },
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    const spenderMap = new Map<Address, bigint>();

    for (const log of approvalLogs) {
      if (!log.args.spender) continue;

      const existing = spenderMap.get(log.args.spender);
      if (!existing || log.blockNumber > existing) {
        spenderMap.set(log.args.spender, log.blockNumber);
      }
    }

    const approvals: ERC20Approval[] = [];

    for (const [spender, blockNumber] of spenderMap.entries()) {
      try {
        const allowance = await client.readContract({
          address: tokenAddress,
          abi: ERC20_ALLOWANCE_ABI,
          functionName: 'allowance',
          args: [address, spender],
        });

        if (allowance > 0n) {
          const approval: ERC20Approval = {
            token: tokenAddress,
            spender,
            allowance,
            lastUpdated: {
              blockNumber,
              timestamp: 0,
            },
          };

          if (options.includeTokenInfo) {
            try {
              const [name, symbol, decimals] = await Promise.all([
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'name',
                }),
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'symbol',
                }),
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_TOKEN_INFO_ABI,
                  functionName: 'decimals',
                }),
              ]);

              approval.tokenInfo = {
                name: name as string,
                symbol: symbol as string,
                decimals: decimals as number,
              };
            } catch (error) {
              console.warn(`Failed to fetch token info for ${tokenAddress}:`, error);
            }
          }

          approvals.push(approval);
        }
      } catch (error) {
        console.warn(`Failed to check allowance for ${tokenAddress} -> ${spender}:`, error);
      }
    }

    return approvals;
  } catch (error) {
    console.error('Error querying ERC20 approvals for token:', error);
    throw new Error(
      `Failed to query ERC20 approvals for token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
