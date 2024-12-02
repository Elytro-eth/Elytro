import { keccak256, encodeAbiParameters, encodePacked, Hex } from 'viem';

import { mainnet, optimism, optimismSepolia, sepolia } from 'viem/chains';

export type SDKInitConfig = {
  endpoint: string; // rpc url
  bundler: string; // bundler url
  factory: string; // factory address
  fallback: string; // fallback address
  recovery: string; // social recovery module address
  validator: string; // validator address
};

export const SDK_INIT_CONFIG_BY_CHAIN_MAP: Record<number, SDKInitConfig> = {
  [optimismSepolia.id]: {
    endpoint:
      'https://opt-sepolia.g.alchemy.com/v2/q9tQ1GMZy-4gtTuQQO6JF_5m_Bf1NYdq', //this.chain.rpcUrls.default.http[0], //
    bundler:
      'https://soulwallet.optimism-sepolia.voltaire.candidewallet.com/rpc',
    factory: '0xF78Ae187CED0Ca5Fb98100d3F0EAB7a6461d6fC6',
    fallback: '0x880c6eb80583795625935B08AA28EB37F16732C7',
    recovery: '0x3Cc36538cf53A13AF5C28BB693091e23CF5BB567',
    validator: '0x2425b23C5C2B322E664334debBa04eE73871ebf7',
  },
  // TODO: change to respective chain config
  [mainnet.id]: {
    endpoint:
      'https://opt-sepolia.g.alchemy.com/v2/q9tQ1GMZy-4gtTuQQO6JF_5m_Bf1NYdq', //this.chain.rpcUrls.default.http[0], //
    bundler:
      'https://soulwallet.optimism-sepolia.voltaire.candidewallet.com/rpc',
    factory: '0xF78Ae187CED0Ca5Fb98100d3F0EAB7a6461d6fC6',
    fallback: '0x880c6eb80583795625935B08AA28EB37F16732C7',
    recovery: '0x3Cc36538cf53A13AF5C28BB693091e23CF5BB567',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
  },
  [sepolia.id]: {
    endpoint:
      // 'https://eth-sepolia.g.alchemy.com/v2/Gp8ptWCctltOyYxWVlQMI_eg8Uj44o64',
      'https://ethereum-sepolia-rpc.publicnode.com',
    bundler:
      'https://api.pimlico.io/v2/11155111/rpc?apikey=pim_7KhEvjRKpLviLbtDBuHySr',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
  },
  [optimism.id]: {
    endpoint:
      'https://opt-mainnet.g.alchemy.com/v2/GCSFuO3fOSch0AQ4JQThV5CO_McJvA0V', //this.chain.rpcUrls.default.http[0], //
    bundler:
      // 'https://soulwallet.optimism-sepolia.voltaire.candidewallet.com/rpc',
      'https://api.pimlico.io/v2/10/rpc?apikey=pim_7KhEvjRKpLviLbtDBuHySr',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
  },
};

const SOUL_WALLET_MSG_TYPE_HASH =
  '0x04e6b5b1de6ba008d582849d4956d004d09a345fc11e7ba894975b5b56a4be66';
// keccak256(
//   toBytes('SoulWalletMessage(bytes32 message)')
// );
const DOMAIN_SEPARATOR_TYPE_HASH =
  '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218';
// keccak256(
//   toBytes('EIP712Domain(uint256 chainId,address verifyingContract)')
// );

export const getEncoded1271MessageHash = (message: Hex) => {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'bytes32' }],
      [SOUL_WALLET_MSG_TYPE_HASH, message]
    )
  );
};

export const getDomainSeparator = (chainIdHex: Hex, walletAddress: Hex) => {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'uint256' }, { type: 'address' }],
      [DOMAIN_SEPARATOR_TYPE_HASH, BigInt(chainIdHex), walletAddress]
    )
  );
};

export const getEncodedSHA = (
  domainSeparator: Hex,
  encode1271MessageHash: Hex
) => {
  return keccak256(
    encodePacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', domainSeparator, encode1271MessageHash]
    )
  );
};
