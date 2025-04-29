import { keccak256, encodeAbiParameters, encodePacked, Hex, zeroHash, parseAbiParameters, toBytes } from 'viem';

export const DEFAULT_GUARDIAN_SAFE_PERIOD = 10; // 48 * 60 * 60; // 48 hours in seconds

export const DEFAULT_GUARDIAN_HASH = zeroHash;

const SOUL_WALLET_MSG_TYPE_HASH =
  // '0x04e6b5b1de6ba008d582849d4956d004d09a345fc11e7ba894975b5b56a4be66';
  keccak256(
    // below for old Contract (op sepolia)
    // toBytes('SoulWalletMessage(bytes32 message)')
    // below for new Contract (sepolia)
    toBytes('ElytroMessage(bytes32 message)')
  );
const DOMAIN_SEPARATOR_TYPE_HASH = '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218';
// keccak256(
//   toBytes('EIP712Domain(uint256 chainId,address verifyingContract)')
// );

export const GUARDIAN_INFO_KEY = '0x1ace5ad304fe21562a90af48910fa441fc548c59f541c00cc8338faaa3de3990';
// keccak256(toBytes('GUARDIAN_INFO'));

export const getEncoded1271MessageHash = (message: Hex) => {
  return keccak256(
    encodeAbiParameters(parseAbiParameters(['bytes32', 'bytes32']), [SOUL_WALLET_MSG_TYPE_HASH, message])
  );
};

export const getDomainSeparator = (chainIdHex: Hex, walletAddress: Hex) => {
  return keccak256(
    encodeAbiParameters(parseAbiParameters(['bytes32', 'uint256', 'address']), [
      DOMAIN_SEPARATOR_TYPE_HASH,
      BigInt(chainIdHex),
      walletAddress,
    ])
  );
};

export const getEncodedSHA = (domainSeparator: Hex, encode1271MessageHash: Hex) => {
  return keccak256(
    encodePacked(['bytes1', 'bytes1', 'bytes32', 'bytes32'], ['0x19', '0x01', domainSeparator, encode1271MessageHash])
  );
};
