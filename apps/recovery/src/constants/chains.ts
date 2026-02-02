import { mainnet, arbitrum, sepolia, optimism, optimismSepolia, scroll, scrollSepolia, Chain } from 'wagmi/chains';

// Re-export CHAIN_LOGOS from shared UI package for consistency
export { CHAIN_LOGOS, getChainLogo } from '@elytro/ui';

const customMainnet = {
  ...mainnet,
  rpcUrls: {
    default: {
      http: ['https://eth.llamarpc.com', 'https://eth.drpc.org', 'https://1rpc.io/eth'],
    },
  },
};

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  customMainnet,
  arbitrum,
  sepolia,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
];

export const CHAIN_ID_TO_NAME_MAP: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [arbitrum.id]: 'Arbitrum One',
  [sepolia.id]: 'Sepolia',
  [optimism.id]: 'Optimism',
  [optimismSepolia.id]: 'Optimism Sepolia',
  // [scroll.id]: 'Scroll',
  // [scrollSepolia.id]: 'Scroll Sepolia',
};
