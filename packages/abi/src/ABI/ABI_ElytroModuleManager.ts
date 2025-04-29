//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'function',
    name: 'executeFromModule',
    inputs: [
      {
        name: 'dest',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'func',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'installModule',
    inputs: [
      {
        name: 'moduleAndData',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isInstalledModule',
    inputs: [
      {
        name: 'module',
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
    name: 'listModule',
    inputs: [],
    outputs: [
      {
        name: 'modules',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'selectors',
        type: 'bytes4[][]',
        internalType: 'bytes4[][]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'uninstallModule',
    inputs: [
      {
        name: 'moduleAddress',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ModuleInstalled',
    inputs: [
      {
        name: 'module',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ModuleUninstalled',
    inputs: [
      {
        name: 'module',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ModuleUninstalledwithError',
    inputs: [
      {
        name: 'module',
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
    name: 'CALLER_MUST_BE_AUTHORIZED_MODULE',
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
    name: 'INVALID_MODULE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'INVALID_SELECTOR',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MODULE_EXECUTE_FROM_MODULE_RECURSIVE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MODULE_NOT_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MODULE_SELECTORS_EMPTY',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MOUDLE_ALREADY_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SELECTOR_ALREADY_EXISTS',
    inputs: [],
  },
];
