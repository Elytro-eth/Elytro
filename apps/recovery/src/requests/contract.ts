import { SUPPORTED_CHAINS } from '@/constants/chains';
import { SocialRecoveryContractConfig, SocialRecoveryInfoRecorderContractConfig } from '@/constants/contracts';
import { RecoveryStatusEn } from '@/constants/enums';
import { toast } from '@/hooks/use-toast';
import { getConfig } from '@/wagmi';
import { SocialRecovery } from '@soulwallet/sdk';
import {
  Address,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  Hex,
  http,
  isAddress,
  parseAbi,
  parseAbiItem,
  parseAbiParameters,
  zeroHash,
} from 'viem';
import { readContract } from 'wagmi/actions';

export const getWalletNonce = async (wallet?: string, chainId?: number) => {
  try {
    if (!wallet || !isAddress(wallet)) {
      toast({
        title: 'Invalid wallet address',
        description: 'Please enter a valid wallet address',
      });
      return null;
    }

    const res = await readContract(getConfig(), {
      address: SocialRecoveryContractConfig.address,
      abi: SocialRecoveryContractConfig.abi,
      functionName: 'walletNonce',
      args: [wallet],
      chainId: chainId,
    });
    return Number(res);
  } catch {
    return null;
  }
};

export const getSocialRecoveryTypedData = async (
  wallet: string,
  chainId: number,
  nonce: number,
  newOwners: string[]
) => {
  return {
    domain: {
      name: 'SocialRecovery',
      version: '1',
      chainId,
      verifyingContract: SocialRecoveryContractConfig.address,
    },
    types: {
      SocialRecovery: [
        {
          name: 'wallet',
          type: 'address',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'newOwners',
          type: 'bytes32[]',
        },
      ],
    },
    message: {
      wallet,
      nonce: BigInt(nonce),
      newOwners,
    },
    primaryType: 'SocialRecovery',
  };
};

// const getRawGuardian = ({
//   guardians,
//   threshold,
//   salt,
// }: TRecoveryContactsInfo) => {
//   if (guardians.length === 0) {
//     return '0x';
//   }

//   guardians = [...guardians];
//   guardians.sort((a, b) => {
//     const aBig = BigInt(a);
//     const bBig = BigInt(b);
//     if (aBig === bBig) {
//       throw new Error(`guardian address is duplicated: ${a}`);
//     } else if (aBig < bBig) {
//       return -1;
//     } else {
//       return 1;
//     }
//   });

//   const guardianData = encodeAbiParameters(
//     parseAbiParameters(['address[]', 'uint256', 'uint256']),
//     [guardians as Address[], BigInt(threshold), BigInt(salt)]
//   );
//   return guardianData;
// };

// const generateGuardianSignatures = (
//   guardianSignatures: TGuardianSignature[],
//   threshold: number,
//   guardians: string[]
// ) => {
//   const guardianSignatureMap = new Map(guardianSignatures.map((sig) => [sig.guardian.toLowerCase(), sig]));

//   const result: GuardianSignature[] = [];

//   for (let j = 0, collectedSign = 0; j < guardians.length && collectedSign < threshold; j++) {
//     const guardianAddress = guardians[j].toLowerCase();

//     if (collectedSign >= threshold) {
//       result.push({
//         signatureType: 3, // no signature
//         address: guardianAddress,
//         signature: '',
//       });
//     } else {
//       const _guardianSignature = guardianSignatureMap.get(guardianAddress);

//       if (_guardianSignature) {
//         result.push({
//           signatureType: 2,
//           address: guardianAddress,
//           signature: _guardianSignature.guardianSignature,
//         });
//         collectedSign++;
//       } else {
//         result.push({
//           signatureType: 3, // no signature
//           address: guardianAddress,
//           signature: '',
//         });
//       }
//     }
//   }

//   return result;
// };

const getGuardianSignatures = (contacts: TContact[]) => {
  return contacts.map((contact) => {
    return {
      address: contact.address,
      signatureType: (contact.confirmed ? 1 : 3) as 0 | 1 | 2 | 3,
    };
  });
};

const convertAddressToBytes32 = (address: string) => {
  return `0x${address.slice(2).padStart(64, '0')}` as `0x${string}`;
};

const RECOVERY_SALT = zeroHash;

export const getRecoveryStartTxData = (
  walletAddress: string,
  newOwners: string[],
  contacts: TContact[],
  threshold: number
) => {
  const rawGuardian = SocialRecovery.getGuardianBytes(
    contacts.map((contact) => contact.address),
    threshold,
    RECOVERY_SALT
  );

  const packedGuardianSignature = SocialRecovery.packGuardianSignature(getGuardianSignatures(contacts));

  // convert address(bytes20) to bytes32
  const ownersInBytes32 = newOwners.map((owner) => convertAddressToBytes32(owner));

  const data = encodeFunctionData({
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'scheduleRecovery',
    args: [walletAddress as Address, ownersInBytes32, rawGuardian as Hex, packedGuardianSignature as Hex],
  });

  return {
    data,
    to: SocialRecoveryContractConfig.address,
  };
};

export const getExecuteRecoveryTxData = (walletAddress: string, newOwners: string[]) => {
  const ownersInBytes32 = newOwners.map((owner) => convertAddressToBytes32(owner));

  const data = encodeFunctionData({
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'executeRecovery',
    args: [walletAddress as Address, ownersInBytes32],
  });

  return {
    data,
    to: SocialRecoveryContractConfig.address,
  };
};

const GUARDIAN_INFO_KEY = '0x1ace5ad304fe21562a90af48910fa441fc548c59f541c00cc8338faaa3de3990';

export const queryRecoveryContacts = async (address: Address, chainId: number) => {
  const client = createPublicClient({
    chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const startBlock = await client.readContract({
    address: SocialRecoveryInfoRecorderContractConfig.address,
    abi: parseAbi([
      'function latestRecordAt(address addr, bytes32 category) external view returns (uint256 blockNumber)',
    ]),
    functionName: 'latestRecordAt',
    args: [address, GUARDIAN_INFO_KEY],
  });

  if (startBlock === 0n) {
    return null;
  }

  const fromBlock = startBlock - 10n > 0n ? startBlock - 10n : 0n;

  const logs = await client.getLogs({
    address: SocialRecoveryInfoRecorderContractConfig.address,
    toBlock: startBlock + 10n,
    fromBlock,
    event: parseAbiItem('event DataRecorded(address indexed wallet, bytes32 indexed category, bytes data)'),
    args: {
      wallet: address,
      category: GUARDIAN_INFO_KEY,
    },
  });

  // Decode the events
  const parseContactFromLog = (log: (typeof logs)[number]) => {
    if (!log || !log.args) {
      return null;
    }
    const parsedLog = decodeAbiParameters(
      parseAbiParameters(['address[]', 'uint256', 'bytes32']),
      (log.args as SafeAny).data
    );
    return {
      contacts: parsedLog[0],
      threshold: Number(parsedLog[1]),
      salt: parsedLog[2] || RECOVERY_SALT,
    } as TRecoveryContactsInfo;
  };

  const latestRecoveryContacts = parseContactFromLog(logs[logs.length - 1]);
  return latestRecoveryContacts;
};

export const getOperationValidTime = async (address: Address, chainId: number, recoveryId: `0x${string}`) => {
  const client = createPublicClient({
    chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const res = await client.readContract({
    address: SocialRecoveryContractConfig.address,
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'getOperationValidTime',
    args: [address, recoveryId],
  });
  return Number(res);
};

export const getOperationState = async (address: Address, chainId: number, recoveryId: `0x${string}`) => {
  const client = createPublicClient({
    chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const status = await client.readContract({
    address: SocialRecoveryContractConfig.address,
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'getOperationState',
    args: [address, recoveryId],
  });

  if (status === RecoveryStatusEn.RECOVERY_STARTED) {
    const validTime = await getOperationValidTime(address, chainId, recoveryId);
    return {
      status,
      validTime,
    };
  }

  return {
    status,
    validTime: 0,
  };
};

export const checkIsContactSigned = async ({
  guardian,
  fromBlock,
  chainId,
}: {
  guardian: Address;
  fromBlock: bigint;
  chainId: number;
}) => {
  const client = createPublicClient({
    chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const logs = await client.getLogs({
    address: SocialRecoveryContractConfig.address,
    fromBlock,
    toBlock: 'latest',
    // TODO: why hash is not indexed?
    event: parseAbiItem('event ApproveHash(address indexed guardian, bytes32 hash)'),
    args: { guardian },
  });

  return logs.length > 0;
};

export const getApproveHashTxData = (hash: `0x${string}`) => {
  const data = encodeFunctionData({
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'approveHash',
    args: [hash],
  });

  return {
    data,
    to: SocialRecoveryContractConfig.address,
  };
};
