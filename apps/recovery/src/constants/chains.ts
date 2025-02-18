import {
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  Chain,
} from 'wagmi/chains';

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
];

export const CHAIN_ID_TO_NAME_MAP: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [sepolia.id]: 'Sepolia',
  [optimism.id]: 'Optimism',
  [optimismSepolia.id]: 'Optimism Sepolia',
  [scroll.id]: 'Scroll',
  [scrollSepolia.id]: 'Scroll Sepolia',
};

export const CHAIN_LOGOS: Record<number, string> = {
  [mainnet.id]: 'https://icons.llamao.fi/icons/chains/rsz_ethereum',
  [sepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_ethereum',
  [optimism.id]: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
  [optimismSepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
  [scroll.id]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
  [scrollSepolia.id]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
};
