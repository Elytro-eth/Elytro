import type { CliConfig, ChainConfig } from '../types';

/**
 * Default chain configurations.
 *
 * Derived from extension's constants/chains.ts.
 * CLI uses the same RPC / bundler endpoints.
 *
 * Pimlico key and Alchemy key should be provided via environment
 * variables or the config file. The URLs below use placeholders.
 */

const PIMLICO_KEY = process.env.ELYTRO_PIMLICO_KEY ?? '';
const ALCHEMY_KEY = process.env.ELYTRO_ALCHEMY_KEY ?? '';

function pimlicoUrl(chainSlug: string): string {
  return `https://api.pimlico.io/v2/${chainSlug}/rpc?apikey=${PIMLICO_KEY}`;
}

function alchemyUrl(network: string): string {
  return `https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}`;
}

export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    endpoint: alchemyUrl('eth-mainnet'),
    bundler: pimlicoUrl('ethereum'),
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io',
  },
  {
    id: 10,
    name: 'Optimism',
    endpoint: alchemyUrl('opt-mainnet'),
    bundler: pimlicoUrl('optimism'),
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    endpoint: alchemyUrl('arb-mainnet'),
    bundler: pimlicoUrl('arbitrum'),
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://arbiscan.io',
  },
  {
    id: 11155111,
    name: 'Sepolia',
    endpoint: alchemyUrl('eth-sepolia'),
    bundler: pimlicoUrl('sepolia'),
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 11155420,
    name: 'Optimism Sepolia',
    endpoint: alchemyUrl('opt-sepolia'),
    bundler: pimlicoUrl('optimism-sepolia'),
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
  },
];

const GRAPHQL_ENDPOINTS: Record<string, string> = {
  development: 'https://api-dev.soulwallet.io/elytroapi/graphql/',
  production: 'https://api.soulwallet.io/elytroapi/graphql/',
};

export function getDefaultConfig(): CliConfig {
  const env = process.env.ELYTRO_ENV ?? 'production';

  return {
    currentChainId: 11155420, // Default to OP Sepolia for safety
    chains: DEFAULT_CHAINS,
    graphqlEndpoint: GRAPHQL_ENDPOINTS[env] ?? GRAPHQL_ENDPOINTS['development'],
    pimlicoKey: PIMLICO_KEY || undefined,
    alchemyKey: ALCHEMY_KEY || undefined,
  };
}
