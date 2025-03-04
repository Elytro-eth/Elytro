export const ABI_RECOVERY_INFO_RECORDER = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'wallet',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'category',
        type: 'bytes32',
      },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'DataRecorded',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'category', type: 'bytes32' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'recordData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const ABI_ERC20_BALANCE_OF = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export const ABI_ERC20_TRANSFER = [
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// export const ABI_ERC20 = [
//   {
//     constant: true,
//     inputs: [],
//     name: 'name',
//     outputs: [
//       {
//         name: '',
//         type: 'string',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     constant: false,
//     inputs: [
//       {
//         name: '_spender',
//         type: 'address',
//       },
//       {
//         name: '_value',
//         type: 'uint256',
//       },
//     ],
//     name: 'approve',
//     outputs: [
//       {
//         name: '',
//         type: 'bool',
//       },
//     ],
//     payable: false,
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     constant: true,
//     inputs: [],
//     name: 'totalSupply',
//     outputs: [
//       {
//         name: '',
//         type: 'uint256',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     constant: false,
//     inputs: [
//       {
//         name: '_from',
//         type: 'address',
//       },
//       {
//         name: '_to',
//         type: 'address',
//       },
//       {
//         name: '_value',
//         type: 'uint256',
//       },
//     ],
//     name: 'transferFrom',
//     outputs: [
//       {
//         name: '',
//         type: 'bool',
//       },
//     ],
//     payable: false,
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     constant: true,
//     inputs: [],
//     name: 'decimals',
//     outputs: [
//       {
//         name: '',
//         type: 'uint8',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     constant: true,
//     inputs: [
//       {
//         name: '_owner',
//         type: 'address',
//       },
//     ],
//     name: 'balanceOf',
//     outputs: [
//       {
//         name: 'balance',
//         type: 'uint256',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     constant: true,
//     inputs: [],
//     name: 'symbol',
//     outputs: [
//       {
//         name: '',
//         type: 'string',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     constant: false,
//     inputs: [
//       {
//         name: '_to',
//         type: 'address',
//       },
//       {
//         name: '_value',
//         type: 'uint256',
//       },
//     ],
//     name: 'transfer',
//     outputs: [
//       {
//         name: '',
//         type: 'bool',
//       },
//     ],
//     payable: false,
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     constant: true,
//     inputs: [
//       {
//         name: '_owner',
//         type: 'address',
//       },
//       {
//         name: '_spender',
//         type: 'address',
//       },
//     ],
//     name: 'allowance',
//     outputs: [
//       {
//         name: '',
//         type: 'uint256',
//       },
//     ],
//     payable: false,
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     payable: true,
//     stateMutability: 'payable',
//     type: 'fallback',
//   },
//   {
//     anonymous: false,
//     inputs: [
//       {
//         indexed: true,
//         name: 'owner',
//         type: 'address',
//       },
//       {
//         indexed: true,
//         name: 'spender',
//         type: 'address',
//       },
//       {
//         indexed: false,
//         name: 'value',
//         type: 'uint256',
//       },
//     ],
//     name: 'Approval',
//     type: 'event',
//   },
//   {
//     anonymous: false,
//     inputs: [
//       {
//         indexed: true,
//         name: 'from',
//         type: 'address',
//       },
//       {
//         indexed: true,
//         name: 'to',
//         type: 'address',
//       },
//       {
//         indexed: false,
//         name: 'value',
//         type: 'uint256',
//       },
//     ],
//     name: 'Transfer',
//     type: 'event',
//   },
// ];

export const ABI_MULTICALL_ERC20 = [
  {
    type: 'function',
    name: 'erc20',
    inputs: [
      {
        name: 'target',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'fetchDecimals',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'fetchSymbol',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'fetchName',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'erc20Addresses',
        type: 'address[]',
        internalType: 'contract IERC20[]',
      },
    ],
    outputs: [
      {
        name: 'balances',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'decimals',
        type: 'uint8[]',
        internalType: 'uint8[]',
      },
      {
        name: 'symbols',
        type: 'string[]',
        internalType: 'string[]',
      },
      {
        name: 'names',
        type: 'string[]',
        internalType: 'string[]',
      },
    ],
    stateMutability: 'view',
  },
];
