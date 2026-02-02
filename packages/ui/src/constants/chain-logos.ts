/**
 * Shared chain logo URLs used across all Elytro apps.
 * This ensures consistency between extension and recovery app.
 */

// Chain IDs (from viem/wagmi)
export const CHAIN_IDS = {
  MAINNET: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  OPTIMISM_SEPOLIA: 11155420,
  SEPOLIA: 11155111,
  SCROLL: 534352,
  SCROLL_SEPOLIA: 534351,
} as const;

/**
 * Chain logo URLs indexed by chain ID.
 * Used for displaying chain icons in the UI.
 */
export const CHAIN_LOGOS: Record<number, string> = {
  [CHAIN_IDS.MAINNET]: 'https://static1.tokenterminal.com//ethereum/logo.png',
  [CHAIN_IDS.ARBITRUM]: 'https://icons.llamao.fi/icons/protocols/arbitrum-timeboost',
  [CHAIN_IDS.OPTIMISM]: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
  [CHAIN_IDS.OPTIMISM_SEPOLIA]:
    'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/optimism-mainnet-light.svg',
  [CHAIN_IDS.SEPOLIA]: 'https://static1.tokenterminal.com//ethereum/logo.png',
  [CHAIN_IDS.SCROLL]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
  [CHAIN_IDS.SCROLL_SEPOLIA]: 'https://icons.llamao.fi/icons/chains/rsz_scroll',
};

/**
 * Get chain logo URL by chain ID.
 * Returns empty string if chain ID is not found.
 */
export const getChainLogo = (chainId: number | undefined): string => {
  if (!chainId) return '';
  return CHAIN_LOGOS[chainId] ?? '';
};
