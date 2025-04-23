//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
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
    name: 'GUARDIAN_SIG_LENGTH_INVALID',
    inputs: [],
  },
  {
    type: 'error',
    name: 'GUARDIAN_THRESHOLD_INVALID',
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
];
