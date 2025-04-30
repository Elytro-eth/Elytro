import { toast } from '@/hooks/use-toast';
import { getConfig } from '@/wagmi';
import { GuardianSignature, SocialRecovery } from '@soulwallet/sdk';
import { Address, encodeFunctionData, Hex, isAddress } from 'viem';
import { readContract } from 'wagmi/actions';

export const SocialRecoveryContractConfig = {
  // Elytro Social Recovery Module. It's same for all chains, for now. make it dynamic later.
  address: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
  abi: [
    {
      type: 'constructor',
      inputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'DeInit',
      inputs: [],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'Init',
      inputs: [
        {
          name: 'data',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'approveHash',
      inputs: [
        {
          name: 'hash',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'approvedHashes',
      inputs: [
        {
          name: '',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'cancelAllRecovery',
      inputs: [],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'eip712Domain',
      inputs: [],
      outputs: [
        {
          name: 'fields',
          type: 'bytes1',
          internalType: 'bytes1',
        },
        {
          name: 'name',
          type: 'string',
          internalType: 'string',
        },
        {
          name: 'version',
          type: 'string',
          internalType: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'salt',
          type: 'bytes32',
          internalType: 'bytes32',
        },
        {
          name: 'extensions',
          type: 'uint256[]',
          internalType: 'uint256[]',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'executeRecovery',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'newOwners',
          type: 'bytes32[]',
          internalType: 'bytes32[]',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getOperationState',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint8',
          internalType: 'enum ISocialRecovery.OperationState',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getOperationValidTime',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getSocialRecoveryInfo',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: 'guardianHash',
          type: 'bytes32',
          internalType: 'bytes32',
        },
        {
          name: 'nonce',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'delayPeriod',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isOperationPending',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isOperationReady',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isOperationSet',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'rejectHash',
      inputs: [
        {
          name: 'hash',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'requiredFunctions',
      inputs: [],
      outputs: [
        {
          name: '',
          type: 'bytes4[]',
          internalType: 'bytes4[]',
        },
      ],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'scheduleRecovery',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'newOwners',
          type: 'bytes32[]',
          internalType: 'bytes32[]',
        },
        {
          name: 'rawGuardian',
          type: 'bytes',
          internalType: 'bytes',
        },
        {
          name: 'guardianSignature',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [
        {
          name: 'recoveryId',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setDelayPeriod',
      inputs: [
        {
          name: 'newDelay',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setGuardian',
      inputs: [
        {
          name: 'newGuardianHash',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'supportsInterface',
      inputs: [
        {
          name: 'interfaceId',
          type: 'bytes4',
          internalType: 'bytes4',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'walletNonce',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '_nonce',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'ApproveHash',
      inputs: [
        {
          name: 'guardian',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'hash',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'DelayPeriodSet',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: false,
          internalType: 'address',
        },
        {
          name: 'newDelay',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'EIP712DomainChanged',
      inputs: [],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'GuardianSet',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: false,
          internalType: 'address',
        },
        {
          name: 'newGuardianHash',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'ModuleDeInit',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'ModuleInit',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'RecoveryCancelled',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: false,
          internalType: 'address',
        },
        {
          name: 'recoveryId',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'RecoveryExecuted',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: false,
          internalType: 'address',
        },
        {
          name: 'recoveryId',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'RecoveryScheduled',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          indexed: false,
          internalType: 'address',
        },
        {
          name: 'recoveryId',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
        {
          name: 'operationValidTime',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'RejectHash',
      inputs: [
        {
          name: 'guardian',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'hash',
          type: 'bytes32',
          indexed: false,
          internalType: 'bytes32',
        },
      ],
      anonymous: false,
    },
    {
      type: 'error',
      name: 'ECDSAInvalidSignature',
      inputs: [],
    },
    {
      type: 'error',
      name: 'ECDSAInvalidSignatureLength',
      inputs: [
        {
          name: 'length',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
    },
    {
      type: 'error',
      name: 'ECDSAInvalidSignatureS',
      inputs: [
        {
          name: 's',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
    },
    {
      type: 'error',
      name: 'GUARDIAN_SIGNATURE_INVALID',
      inputs: [],
    },
    {
      type: 'error',
      name: 'HASH_ALREADY_APPROVED',
      inputs: [],
    },
    {
      type: 'error',
      name: 'HASH_ALREADY_REJECTED',
      inputs: [],
    },
    {
      type: 'error',
      name: 'InvalidShortString',
      inputs: [],
    },
    {
      type: 'error',
      name: 'StringTooLong',
      inputs: [
        {
          name: 'str',
          type: 'string',
          internalType: 'string',
        },
      ],
    },
    {
      type: 'error',
      name: 'UNEXPECTED_OPERATION_STATE',
      inputs: [
        {
          name: 'wallet',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'recoveryId',
          type: 'bytes32',
          internalType: 'bytes32',
        },
        {
          name: 'expectedStates',
          type: 'bytes32',
          internalType: 'bytes32',
        },
      ],
    },
  ],
} as const;

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
// }: TGuardianInfo) => {
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

const generateGuardianSignatures = (
  guardianSignatures: TGuardianSignature[],
  threshold: number,
  guardians: string[]
) => {
  const guardianSignatureMap = new Map(guardianSignatures.map((sig) => [sig.guardian.toLowerCase(), sig]));

  const result: GuardianSignature[] = [];

  for (let j = 0, collectedSign = 0; j < guardians.length && collectedSign < threshold; j++) {
    const guardianAddress = guardians[j].toLowerCase();

    if (collectedSign >= threshold) {
      result.push({
        signatureType: 3, // no signature
        address: guardianAddress,
        signature: '',
      });
    } else {
      const _guardianSignature = guardianSignatureMap.get(guardianAddress);

      if (_guardianSignature) {
        result.push({
          signatureType: 2,
          address: guardianAddress,
          signature: _guardianSignature.guardianSignature,
        });
        collectedSign++;
      } else {
        result.push({
          signatureType: 3, // no signature
          address: guardianAddress,
          signature: '',
        });
      }
    }
  }

  return result;
};

export const getRecoveryStartTxData = (
  walletAddress: string,
  newOwners: string[],
  guardianInfo: TGuardianInfo,
  guardianSignatures: TGuardianSignature[]
) => {
  const rawGuardian = SocialRecovery.getGuardianBytes(
    guardianInfo.guardians,
    guardianInfo.threshold,
    guardianInfo.salt
  );

  const packedGuardianSignature = SocialRecovery.packGuardianSignature(
    generateGuardianSignatures(guardianSignatures, guardianInfo.threshold, guardianInfo.guardians)
  );

  const data = encodeFunctionData({
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'scheduleRecovery',
    args: [walletAddress as Address, newOwners as Address[], rawGuardian as Hex, packedGuardianSignature as Hex],
  });

  return {
    data,
    to: SocialRecoveryContractConfig.address,
  };
};

export const getExecuteRecoveryTxData = (walletAddress: string, newOwners: string[]) => {
  const data = encodeFunctionData({
    abi: SocialRecoveryContractConfig.abi,
    functionName: 'executeRecovery',
    args: [walletAddress as Address, newOwners as Address[]],
  });

  return {
    data,
    to: SocialRecoveryContractConfig.address,
  };
};
