//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_entryPoint',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'defaultValidator',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'fallback',
    stateMutability: 'payable',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'VERSION',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
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
    name: 'entryPoint',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'target',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'executeBatch',
    inputs: [
      {
        name: 'executions',
        type: 'tuple[]',
        internalType: 'struct Execution[]',
        components: [
          {
            name: 'target',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'data',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
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
    name: 'getChainId',
    inputs: [],
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
    name: 'initialize',
    inputs: [
      {
        name: 'owners',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
      {
        name: 'defalutCallbackHandler',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'modules',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
      {
        name: 'hooks',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
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
    name: 'isValidSignature',
    inputs: [
      {
        name: '_hash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'signature',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: 'magicValue',
        type: 'bytes4',
        internalType: 'bytes4',
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
    type: 'function',
    name: 'setFallbackHandler',
    inputs: [
      {
        name: 'fallbackContract',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
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
    type: 'function',
    name: 'upgradeFrom',
    inputs: [
      {
        name: 'oldImplementation',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'upgradeTo',
    inputs: [
      {
        name: 'newImplementation',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'validateUserOp',
    inputs: [
      {
        name: 'userOp',
        type: 'tuple',
        internalType: 'struct PackedUserOperation',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'nonce',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'initCode',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'callData',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'accountGasLimits',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'gasFees',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'paymasterAndData',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'signature',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
      {
        name: 'userOpHash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'missingAccountFunds',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'validationData',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    name: 'FallbackChanged',
    inputs: [
      {
        name: 'fallbackContract',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
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
    type: 'event',
    name: 'Initialized',
    inputs: [
      {
        name: 'version',
        type: 'uint64',
        indexed: false,
        internalType: 'uint64',
      },
    ],
    anonymous: false,
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
    type: 'event',
    name: 'Upgraded',
    inputs: [
      {
        name: 'oldImplementation',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newImplementation',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
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
    name: 'CALLER_MUST_BE_AUTHORIZED_MODULE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CALLER_MUST_BE_ENTRY_POINT',
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
    name: 'INVALID_DATA',
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
  {
    type: 'error',
    name: 'INVALID_LOGIC_ADDRESS',
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
    name: 'INVALID_VALIDATOR',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidInitialization',
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
    name: 'NOT_IMPLEMENTED',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotInitializing',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SAME_LOGIC_ADDRESS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SELECTOR_ALREADY_EXISTS',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UPGRADE_FAILED',
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
