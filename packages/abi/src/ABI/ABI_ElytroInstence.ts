//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'defaultCallbackHandler',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'defaultValidator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'owners',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
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
      {
        name: 'salt',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'elytro',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IElytro',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'elytroFactory',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ElytroFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'elytroLogicInstence',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ElytroLogicInstence',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'entryPoint',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract EntryPoint',
      },
    ],
    stateMutability: 'view',
  },
];
