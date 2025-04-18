//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
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
    type: 'error',
    name: 'CALLER_MUST_BE_MODULE',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CALLER_MUST_BE_SELF_OR_MODULE',
    inputs: [],
  },
];
