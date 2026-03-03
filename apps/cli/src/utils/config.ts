import type { CliConfig, ChainConfig } from '../types';

/**
 * Default chain configurations.
 *
 * Uses public RPC endpoints by default — no API keys required.
 * Users can optionally provide their own Alchemy / Pimlico keys
 * via `elytro config set` for higher rate limits and reliability.
 *
 * Resolution order (per-chain endpoint & bundler):
 *   1. User-configured keys from ~/.elytro/user-keys.json → Alchemy/Pimlico URLs
 *   2. Public fallback endpoints (rate-limited but functional)
 *
 * Use `elytro config set alchemy-key <KEY>` to upgrade from public endpoints.
 */

// ─── Public fallback endpoints ──────────────────────────────────────

const PUBLIC_RPC: Record<number, string> = {
  1: 'https://ethereum-rpc.publicnode.com',
  10: 'https://optimism-rpc.publicnode.com',
  42161: 'https://arbitrum-one-rpc.publicnode.com',
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com',
  11155420: 'https://optimism-sepolia-rpc.publicnode.com',
};

const PUBLIC_BUNDLER: Record<number, string> = {
  1: 'https://public.pimlico.io/v2/1/rpc',
  10: 'https://public.pimlico.io/v2/10/rpc',
  42161: 'https://public.pimlico.io/v2/42161/rpc',
  11155111: 'https://public.pimlico.io/v2/11155111/rpc',
  11155420: 'https://public.pimlico.io/v2/11155420/rpc',
};

// ─── Keyed endpoint builders ────────────────────────────────────────

function pimlicoUrl(chainSlug: string, key: string): string {
  return `https://api.pimlico.io/v2/${chainSlug}/rpc?apikey=${key}`;
}

function alchemyUrl(network: string, key: string): string {
  return `https://${network}.g.alchemy.com/v2/${key}`;
}

// ─── Chain slug mappings ────────────────────────────────────────────

const ALCHEMY_NETWORK: Record<number, string> = {
  1: 'eth-mainnet',
  10: 'opt-mainnet',
  42161: 'arb-mainnet',
  11155111: 'eth-sepolia',
  11155420: 'opt-sepolia',
};

const PIMLICO_SLUG: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  42161: 'arbitrum',
  11155111: 'sepolia',
  11155420: 'optimism-sepolia',
};

// ─── Resolve endpoint / bundler for a chain ─────────────────────────

function resolveEndpoint(chainId: number, alchemyKey?: string): string {
  if (alchemyKey) {
    const network = ALCHEMY_NETWORK[chainId];
    if (network) return alchemyUrl(network, alchemyKey);
  }
  return PUBLIC_RPC[chainId] ?? PUBLIC_RPC[11155420];
}

function resolveBundler(chainId: number, pimlicoKey?: string): string {
  if (pimlicoKey) {
    const slug = PIMLICO_SLUG[chainId];
    if (slug) return pimlicoUrl(slug, pimlicoKey);
  }
  return PUBLIC_BUNDLER[chainId] ?? PUBLIC_BUNDLER[11155420];
}

// ─── Build chain configs ────────────────────────────────────────────

interface ChainMeta {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorer: string;
}

const CHAIN_META: ChainMeta[] = [
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io',
  },
  {
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://arbiscan.io',
  },
  {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 11155420,
    name: 'Optimism Sepolia',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
  },
];

export function buildChains(alchemyKey?: string, pimlicoKey?: string): ChainConfig[] {
  return CHAIN_META.map((meta) => ({
    ...meta,
    endpoint: resolveEndpoint(meta.id, alchemyKey),
    bundler: resolveBundler(meta.id, pimlicoKey),
  }));
}

// ─── GraphQL ────────────────────────────────────────────────────────

const GRAPHQL_ENDPOINTS: Record<string, string> = {
  development: 'https://api-dev.soulwallet.io/elytroapi/graphql/',
  production: 'https://api.soulwallet.io/elytroapi/graphql/',
};

// ─── Default config ─────────────────────────────────────────────────

export function getDefaultConfig(): CliConfig {
  const env = process.env.ELYTRO_ENV ?? 'production';

  return {
    currentChainId: 11155420, // Default to OP Sepolia for safety
    chains: buildChains(),
    graphqlEndpoint: GRAPHQL_ENDPOINTS[env] ?? GRAPHQL_ENDPOINTS['development'],
  };
}
