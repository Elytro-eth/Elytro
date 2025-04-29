import {
  DecodeUserOp,
  // TokenInfo,
  AddressType,
  // DecodeResult,
  // Method,
  // Ok, Err, Result
} from '..';
import { ABI_Elytro } from '@elytro/abi';
import { describe, expect, test } from '@jest/globals';
import { ethers } from 'ethers';

describe('Decoder', () => {
  test('Decoder-UserOp', async () => {
    let callData = '0x';

    const abi = new ethers.Interface(ABI_Elytro);

    const to: string[] = [
      '0xccaE58775FcBc01E0bB965Cc153363CD93e2d0f4',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ];
    const value: string[] = ['11', '12'];

    // encode erc20 transfer
    const erc20Interface = new ethers.Interface([
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
    ]);

    const data: string[] = [
      '0x32',
      erc20Interface.encodeFunctionData('transfer', [
        '0x4521C9aD6A3D4230803aB752Ed238BE11F8B342F',
        '0xf',
      ]),
    ];

    if (to.length > 1) {
      /* 
                {
                    "type": "function",
                    "name": "executeBatch",
                    "inputs": [
                    {
                        "name": "executions",
                        "type": "tuple[]",
                        "internalType": "struct Execution[]",
                        "components": [
                        {
                            "name": "target",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "value",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "data",
                            "type": "bytes",
                            "internalType": "bytes"
                        }
                        ]
                    }
                    ],
                    "outputs": [],
                    "stateMutability": "payable"
                },
            */
      const executions: string[][] = [];
      for (let i = 0; i < to.length; i++) {
        const execution: string[] = [to[i], value[i], data[i]];
        executions.push(execution);
      }

      callData = abi.encodeFunctionData(
        'executeBatch((address,uint256,bytes)[])',
        [executions]
      );
    } else {
      callData = abi.encodeFunctionData('execute', [to[0], value[0], data[0]]);
    }

    const userOp = {
      sender: '0xa',
      callData: callData,
    };
    const chainId = 1;
    const entryPoint = '0xb';

    const ret = await DecodeUserOp(chainId, entryPoint, userOp);
    expect(ret.isOk() === true).toBeTruthy();
    const result = ret.OK;
    expect(result.length).toBe(2);
    expect(result[0].from).toBe(userOp.sender);
    expect(result[1].from).toBe(userOp.sender);
    expect(result[1].method!.name!).toBe('transfer');
    expect(result[1].method!.text!).toBe('transfer(address,uint256)');
    expect(result[1].value).toBe(BigInt(12));
    expect(result[1].toInfo).not.toBeUndefined();
    expect(result[1].toInfo!.chainId).toBe(1);
    expect(result[1].toInfo!.decimals).toBe(6);
    expect(result[1].toInfo!.symbol).toBe('USDC');
    expect(result[1].toInfo!.name).toBe('USDCoin');
    expect(result[1].toInfo!.type).toBe(AddressType.Erc20);
  });
});
