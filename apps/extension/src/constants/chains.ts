import {
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
  id: number;
  name: string;
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
      'https://opt-mainnet.g.alchemy.com/v2/GCSFuO3fOSch0AQ4JQThV5CO_McJvA0V', //this.chain.rpcUrls.default.http[0], //
    bundler:
      // 'https://soulwallet.optimism-sepolia.voltaire.candidewallet.com/rpc',
      'https://api.pimlico.io/v2/10/rpc?apikey=pim_7KhEvjRKpLviLbtDBuHySr',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0x0eb1ec2c9031ca30f0a28adef79b5b73b91692c2',
    opExplorer: 'https://optimism.blockscout.com/op/',
    onchainConfig: {
      chainId: optimism.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
  },
  {
    ...optimismSepolia,
    icon: 'https://raw.githubusercontent.com/blockscout/frontend-configs/main/configs/network-icons/optimism-mainnet-light.svg',
    endpoint:
      'https://opt-sepolia.g.alchemy.com/v2/7EJnXZWkG9HIhjj0ZLx7vk_lexCq25Pr',
    // 'https://optimism-sepolia-rpc.publicnode.com',
    bundler:
      'https://api.pimlico.io/v2/optimism-sepolia/rpc?apikey=f1b5c1b8-24a5-440b-b6fe-646c55819509',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    // TODO: for now only support optimism sepolia
    infoRecorder: '0x0eb1ec2c9031ca30f0a28adef79b5b73b91692c2',
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
      'https://eth-sepolia.g.alchemy.com/v2/7EJnXZWkG9HIhjj0ZLx7vk_lexCq25Pr',
    // 'https://ethereum-sepolia-rpc.publicnode.com',
    bundler:
      'https://api.pimlico.io/v2/11155111/rpc?apikey=pim_7KhEvjRKpLviLbtDBuHySr',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    infoRecorder: '0x0eb1ec2c9031ca30f0a28adef79b5b73b91692c2',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    onchainConfig: {
      chainId: sepolia.id,
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
    opExplorer: 'https://jiffyscan.xyz/userOpHash/',
  },
  // {
  //   ...scrollSepolia,
  //   icon: 'https://icons.llamao.fi/icons/chains/rsz_scroll.jpg',
  //   endpoint:
  //     'https://scroll-sepolia.g.alchemy.com/v2/7EJnXZWkG9HIhjj0ZLx7vk_lexCq25Pr',
  //   bundler:
  //     'https://api.pimlico.io/v2/534351/rpc?apikey=pim_7KhEvjRKpLviLbtDBuHySr',
  //   factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
  //   fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
  //   recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
  //   validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
  //   onchainConfig: {
  //     chainId: scrollSepolia.id,
  //     entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  //     soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
  //   },
  //   opExplorer: 'https://jiffyscan.xyz/userOpHash/',
  // },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);

export const getIconByChainId = (chainId: number | undefined) =>
  chainId ? SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.icon : '';

export const getChainNameByChainId = (chainId: number) =>
  SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.name;

// from block number of info recorder
export const FROM_BLOCK_NUMBER_OF_INFO_RECORDER_MAP: Record<
  number,
  bigint | 'latest'
> = {
  [optimism.id]: 128763383n,
  [optimismSepolia.id]: 20661477n,
  [sepolia.id]: 7194730n,
  // [scrollSepolia.id]: 'latest',
};

// EIP-3770
export const EIP3770_CHAIN_PREFIX_MAP: Record<number, string> = {
  [optimism.id]: 'op',
  [optimismSepolia.id]: 'opsep',
  [sepolia.id]: 'sepolia',
  // [scrollSepolia.id]: 'scrollsep',
};
