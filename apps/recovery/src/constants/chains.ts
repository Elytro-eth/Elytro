import { mainnet, arbitrum, sepolia, optimism, optimismSepolia, scroll, scrollSepolia, Chain } from 'wagmi/chains';

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

export const CHAIN_LOGOS: Record<number, string> = {
  [mainnet.id]: 'https://icons.llamao.fi/icons/chains/rsz_ethereum',
  [arbitrum.id]: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum',
  [sepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_ethereum',
  [optimism.id]: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
  [optimismSepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
  // [scroll.id]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
  // [scrollSepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
};
