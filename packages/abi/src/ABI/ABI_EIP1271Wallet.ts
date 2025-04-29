//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'function',
    name: 'isValidSignature',
    inputs: [
      {
        name: 'hash',
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
    stateMutability: 'pure',
  },
];
