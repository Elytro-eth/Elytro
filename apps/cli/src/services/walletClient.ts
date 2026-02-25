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

  /** Expose the raw viem client for advanced use. */
  get raw(): PublicClient {
    return this.ensureClient();
  }
}
