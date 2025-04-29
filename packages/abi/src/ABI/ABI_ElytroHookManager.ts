//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'function',
    name: 'installHook',
    inputs: [
      {
        name: 'hookAndData',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'capabilityFlags',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isInstalledHook',
    inputs: [
      {
        name: 'hook',
        type: 'address',
        internalType: 'address',
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
    name: 'listHook',
    inputs: [],
    outputs: [
      {
        name: 'preIsValidSignatureHooks',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'preUserOpValidationHooks',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'uninstallHook',
    inputs: [
      {
        name: 'hookAddress',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'HookInstalled',
    inputs: [
      {
        name: 'hook',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'HookUninstalled',
    inputs: [
      {
        name: 'hook',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'HookUninstalledwithError',
    inputs: [
      {
        name: 'hook',
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
    name: 'HOOK_ALREADY_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'HOOK_NOT_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_ADDRESS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_HOOK',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_HOOK_SIGNATURE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_HOOK_TYPE',
    inputs: [],
  },
];
