//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`

export default [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_price',
        type: 'int256',
        internalType: 'int256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'latestRoundData',
    inputs: [],
    outputs: [
      {
        name: 'roundId',
        type: 'uint80',
        internalType: 'uint80',
      },
      {
        name: 'answer',
        type: 'int256',
        internalType: 'int256',
      },
      {
        name: 'startedAt',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'updatedAt',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'answeredInRound',
        type: 'uint80',
        internalType: 'uint80',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'price',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'int256',
        internalType: 'int256',
      },
    ],
    stateMutability: 'view',
  },
];
