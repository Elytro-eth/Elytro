import CONFIG from '@/config';
import {
  arbitrum,
  Chain,
  mainnet,
  optimism,
  optimismSepolia,
  // scrollSepolia,
  sepolia,
} from 'viem/chains';

export type TChainConfigItem = {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
  bundlerUrl: string;
  currencySymbol: { name: string; symbol: string; decimals: number };
  ensContractAddress: string;
  icon?: string;
};

export type TChainItem = Chain & {
  icon?: string;
  opExplorer?: string;
  endpoint: string; // rpc url
  bundler: string; // bundler url
  stablecoins?: {
    name: string;
    address: string[];
  }[];
};

export const SUPPORTED_CHAINS: TChainItem[] = [
  {
    ...mainnet,
    icon: 'https://static1.tokenterminal.com//ethereum/logo.png',
    endpoint: 'https://eth.drpc.org',
    bundler: `https://api.pimlico.io/v2/1/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    opExplorer: 'https://eth.blockscout.com/op/',
    stablecoins: [
      {
        name: 'USDC',
        address: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
      },
      {
        name: 'USDT',
        address: [
          '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          '0xDe60aDfDdAAbaAAC3dAFa57B26AcC91Cb63728c4',
          '0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C',
          '0x58efE15C0404aB22F87E4495D71f6f2077e862bE',
        ],
      },
      {
        name: 'DAI',
        address: ['0x6B175474E89094C44Da98b954EedeAC495271d0F'],
      },
    ],
  },
  {
    ...arbitrum,
    icon: 'https://icons.llamao.fi/icons/protocols/arbitrum-timeboost',
    endpoint: arbitrum.rpcUrls.default.http[0] || `https://arb-mainnet.g.alchemy.com/v2/${CONFIG.rpc.alchemyKey}`,
    bundler: `https://api.pimlico.io/v2/42161/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    opExplorer: 'https://arbitrum.blockscout.com/op/',
    stablecoins: [
      {
        name: 'USDC',
        address: ['0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
      },
      {
        name: 'USDT',
        address: ['0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'],
      },
      {
        name: 'DAI',
        address: ['0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'],
      },
    ],
  },
  {
    ...optimism,
    icon: 'https://icons.llamao.fi/icons/chains/rsz_optimism',
    endpoint:
      optimism.rpcUrls.default.http[0] ||
      `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    bundler: `https://api.pimlico.io/v2/10/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`,
    opExplorer: 'https://explorer.optimism.io/op/',
    stablecoins: [
      {
        name: 'USDC',
        address: ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'],
      },
      {
        name: 'USDT',
        address: ['0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'],
      },
      {
        name: 'DAI',
        address: ['0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'],
      },
    ],
  },

  {
    ...optimismSepolia,
    icon: 'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/optimism-mainnet-light.svg',
    endpoint:
      optimismSepolia.rpcUrls.default.http[0] || `https://opt-sepolia.g.alchemy.com/v2/${CONFIG.rpc.alchemyKey}`,
    bundler: `https://api.pimlico.io/v2/11155420/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    stablecoins: [
      {
        name: 'USDC',
        address: ['0x5fd84259d66Cd46123540766Be93DFE6D43130D7'],
      },
    ],
    opExplorer: 'https://testnet-explorer.optimism.io/op/',
  },
  {
    ...sepolia,
    icon: 'https://static1.tokenterminal.com//ethereum/logo.png',
    endpoint: 'https://0xrpc.io/sep',
    // || `https://eth-sepolia.g.alchemy.com/v2/${CONFIG.rpc.alchemyKey}`,
    bundler: `https://api.pimlico.io/v2/11155111/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    opExplorer: 'https://eth-sepolia.blockscout.com/op/',
    stablecoins: [
      {
        name: 'USDC',
        address: ['0xbe72E441BF55620febc26715db68d3494213D8Cb', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'],
      },
    ],
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);

export const getIconByChainId = (chainId: number | undefined) =>
  chainId ? SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.icon : '';

export const getChainNameByChainId = (chainId: number) => SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.name;

// EIP-3770: get short chain name from :https://github.com/ethereum-lists/chains/tree/55e0b3bb7d8678f083d0549c0b2d16ec675c4378/_data/chains
export const EIP3770_CHAIN_PREFIX_MAP: Record<number, string> = {
  [mainnet.id]: 'eth',
  [optimism.id]: 'oeth',
  [arbitrum.id]: 'arb1',
  [optimismSepolia.id]: 'opsep',
  [sepolia.id]: 'sep',
  // [scrollSepolia.id]: 'scrollsep',
};

export enum ChainOperationEn {
  Switch = 'switch',
  Update = 'update',
}
