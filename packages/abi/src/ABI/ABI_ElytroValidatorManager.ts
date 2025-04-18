//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'function',
    name: 'installValidator',
    inputs: [
      {
        name: 'validatorAndData',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'listValidator',
    inputs: [],
    outputs: [
      {
        name: 'validators',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'uninstallValidator',
    inputs: [
      {
        name: 'validator',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ValidatorInstalled',
    inputs: [
      {
        name: 'validator',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ValidatorUninstalled',
    inputs: [
      {
        name: 'validator',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ValidatorUninstalledwithError',
    inputs: [
      {
        name: 'validator',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'ADDRESS_ALREADY_EXISTS',
    inputs: [],
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
    name: 'INVALID_ADDRESS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_VALIDATOR',
    inputs: [],
  },
  {
    type: 'error',
    name: 'VALIDATOR_ALREADY_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'VALIDATOR_NOT_EXISTS',
    inputs: [],
  },
];
