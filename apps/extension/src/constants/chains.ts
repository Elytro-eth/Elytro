import CONFIG from '@/config';
import { EntryPointVersion } from 'viem/account-abstraction';
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
  endpoint: string; // rpc url
  bundler: string; // bundler url
  factory: string; // factory address
  fallback: string; // fallback address
  recovery: string; // social recovery module address
  validator: string; // validator address
  infoRecorder?: string; // info recorder address
  // onchain config. If provided, it will be used to initialize the SDK and the SDK won't check chain config anymore.
  onchainConfig: {
    chainId: number;
    entryPoint: string;
    entryPointVersion: EntryPointVersion;
    soulWalletLogic: string;
  };
  opExplorer?: string;
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
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      chainId: mainnet.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      entryPointVersion: '0.7',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
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
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    endpoint: arbitrum.rpcUrls.default.http[0] || `https://arb-mainnet.g.alchemy.com/v2/${CONFIG.rpc.alchemyKey}`,
    bundler: `https://api.pimlico.io/v2/42161/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      chainId: arbitrum.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      entryPointVersion: '0.7',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://jiffyscan.xyz/userOpHash/',
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
    icon: 'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/optimism-mainnet-light.svg',
    endpoint:
      optimism.rpcUrls.default.http[0] ||
      `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    bundler: `https://api.pimlico.io/v2/10/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    opExplorer: 'https://optimism.blockscout.com/op/',
    onchainConfig: {
      chainId: optimism.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      entryPointVersion: '0.7',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
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
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    // TODO: for now only support optimism sepolia
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      chainId: optimismSepolia.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      entryPointVersion: '0.7',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://optimism-sepolia.blockscout.com/op/',
    stablecoins: [
      {
        name: 'USDC',
        address: ['0x5fd84259d66Cd46123540766Be93DFE6D43130D7'],
      },
    ],
  },
  {
    ...sepolia,
    icon: 'https://static1.tokenterminal.com//ethereum/logo.png',
    endpoint: sepolia.rpcUrls.default.http[0] || `https://eth-sepolia.g.alchemy.com/v2/${CONFIG.rpc.alchemyKey}`,
    bundler: `https://api.pimlico.io/v2/11155111/rpc?apikey=${CONFIG.rpc.pimlicoKey}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    onchainConfig: {
      chainId: sepolia.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      entryPointVersion: '0.7',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://jiffyscan.xyz/userOpHash/',
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
