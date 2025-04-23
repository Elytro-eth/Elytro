//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'function',
    name: 'addOwner',
    inputs: [
      {
        name: 'owner',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addOwners',
    inputs: [
      {
        name: 'owners',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isOwner',
    inputs: [
      {
        name: 'owner',
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
    name: 'listOwner',
    inputs: [],
    outputs: [
      {
        name: 'owners',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'removeOwner',
    inputs: [
      {
        name: 'owner',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resetOwner',
    inputs: [
      {
        name: 'newOwner',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resetOwners',
    inputs: [
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
    type: 'event',
    name: 'OwnerAdded',
    inputs: [
      {
        name: 'owner',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnerCleared',
    inputs: [],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnerRemoved',
    inputs: [
      {
        name: 'owner',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'CALLER_MUST_BE_MODULE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CALLER_MUST_BE_SELF_OR_MODULE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'DATA_ALREADY_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'DATA_NOT_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_DATA',
    inputs: [],
  },
];
