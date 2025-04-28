import {
  arbitrum,
  Chain,
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
    soulWalletLogic: string;
  };
  opExplorer: string;
};

export const SUPPORTED_CHAINS: TChainItem[] = [
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
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
  },
  {
    ...arbitrum,
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    endpoint:
      arbitrum.rpcUrls.default.http[0] ||
      `https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    bundler: `https://api.pimlico.io/v2/42161/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      chainId: arbitrum.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://jiffyscan.xyz/userOpHash/',
  },
  {
    ...optimismSepolia,
    icon: 'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/optimism-mainnet-light.svg',
    endpoint:
      optimismSepolia.rpcUrls.default.http[0] ||
      `https://opt-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    bundler: `https://api.pimlico.io/v2/11155420/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    // TODO: for now only support optimism sepolia
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      chainId: optimismSepolia.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://optimism-sepolia.blockscout.com/op/',
  },
  {
    ...sepolia,
    icon: 'https://etherscan.io/images/svg/brands/ethereum-original.svg',
    endpoint:
      sepolia.rpcUrls.default.http[0] ||
      `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    bundler: `https://api.pimlico.io/v2/11155111/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`,
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    onchainConfig: {
      chainId: sepolia.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://jiffyscan.xyz/userOpHash/',
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);

export const getIconByChainId = (chainId: number | undefined) =>
  chainId ? SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.icon : '';

export const getChainNameByChainId = (chainId: number) =>
  SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.name;

// EIP-3770: get short chain name from :https://github.com/ethereum-lists/chains/tree/55e0b3bb7d8678f083d0549c0b2d16ec675c4378/_data/chains
export const EIP3770_CHAIN_PREFIX_MAP: Record<number, string> = {
  [optimism.id]: 'oeth',
  [optimismSepolia.id]: 'opsep',
  [sepolia.id]: 'sep',
  // [scrollSepolia.id]: 'scrollsep',
};

export enum ChainOperationEn {
  Switch = 'switch',
  Update = 'update',
}
