import { createPublicClient, http, formatEther, type PublicClient, type Address, type Chain } from 'viem';
import type { ChainConfig } from '../types';

/**
 * WalletClientService — on-chain read operations.
 *
 * Business intent (from extension's WalletClient):
 * - Thin wrapper around viem PublicClient
 * - Provide balance, code, block, token info queries
 * - Reinitialize when chain switches
 *
 * CLI differences:
 * - No eventBus listener — explicitly call `initForChain()`
 * - Returns plain values, no reactive state
 */
export class WalletClientService {
  private client: PublicClient | null = null;
  private chainConfig: ChainConfig | null = null;

  initForChain(chainConfig: ChainConfig): void {
    const viemChain: Chain = {
      id: chainConfig.id,
      name: chainConfig.name,
      nativeCurrency: chainConfig.nativeCurrency,
      rpcUrls: {
        default: { http: [chainConfig.endpoint] },
      },
      blockExplorers: chainConfig.blockExplorer
        ? {
            default: {
              name: chainConfig.name,
              url: chainConfig.blockExplorer,
            },
          }
        : undefined,
    };

    this.client = createPublicClient({
      chain: viemChain,
      transport: http(chainConfig.endpoint),
    });
    this.chainConfig = chainConfig;
  }

  private ensureClient(): PublicClient {
    if (!this.client) {
      throw new Error('WalletClient not initialized. Call initForChain().');
    }
    return this.client;
  }

  // ─── Queries ────────────────────────────────────────────────────

  async getBalance(address: Address): Promise<{ wei: bigint; ether: string }> {
    const client = this.ensureClient();
    const wei = await client.getBalance({ address });
    return { wei, ether: formatEther(wei) };
  }

  async getCode(address: Address): Promise<string | undefined> {
    const client = this.ensureClient();
    return client.getCode({ address });
  }

  async isContractDeployed(address: Address): Promise<boolean> {
    const code = await this.getCode(address);
    return !!code && code !== '0x';
  }

  async getBlockNumber(): Promise<bigint> {
    const client = this.ensureClient();
    return client.getBlockNumber();
  }

  async readContract(params: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args?: unknown[];
  }): Promise<unknown> {
    const client = this.ensureClient();
    return client.readContract(params as Parameters<typeof client.readContract>[0]);
  }

  /**
   * Fetch gas price from the network.
   */
  async getGasPrice(): Promise<bigint> {
    const client = this.ensureClient();
    return client.getGasPrice();
  }

  /**
   * Fetch a transaction receipt by hash.
   */
  async getTransactionReceipt(hash: `0x${string}`): Promise<{
    status: 'success' | 'reverted';
    blockNumber: bigint;
    gasUsed: bigint;
    from: Address;
    to: Address | null;
    transactionHash: `0x${string}`;
  } | null> {
    const client = this.ensureClient();
    try {
      const receipt = await client.getTransactionReceipt({ hash });
      return {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        from: receipt.from,
        to: receipt.to,
        transactionHash: receipt.transactionHash,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get all ERC-20 token balances for an address via Alchemy's custom RPC method.
   * Returns only tokens with non-zero balance.
   *
   * Requires an Alchemy RPC endpoint.
   */
  async getTokenBalances(address: Address): Promise<Array<{ tokenAddress: Address; balance: bigint }>> {
    const client = this.ensureClient();

    // alchemy_getTokenBalances is a custom Alchemy JSON-RPC method
    // Params: [address, "erc20"] — "erc20" returns all ERC-20 tokens
    const result = (await client.request({
      method: 'alchemy_getTokenBalances',
      params: [address, 'erc20'],
    } as SafeAny)) as {
      tokenBalances: Array<{
        contractAddress: string;
        tokenBalance: string;
        error: string | null;
      }>;
    };

    if (!result?.tokenBalances) return [];

    return result.tokenBalances
      .filter((t) => !t.error && t.tokenBalance && t.tokenBalance !== '0x' && t.tokenBalance !== '0x0')
      .map((t) => ({
        tokenAddress: t.contractAddress as Address,
        balance: BigInt(t.tokenBalance),
      }))
      .filter((t) => t.balance > 0n);
  }

  /** Current chain config (after initForChain). */
  get currentChainConfig(): ChainConfig | null {
    return this.chainConfig;
  }

  /** Expose the raw viem client for advanced use. */
  get raw(): PublicClient {
    return this.ensureClient();
  }
}
