@elytro/decoder / [Modules](modules.md)

<h1 align="center">
   <b>
        @elytro/decoder
    </b>
</h1>

<p align="center">
A lib for decode userOp.calldata. If it contains known token information, it will also output the token details.
</p>

<p align="center">
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/tree/develop/packages/decoder"><b>Code</b></a> •
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/blob/develop/packages/decoder/docs/modules.md"><b>Documentation</b></a>
</p>

## Table of Contents

  - [Installing](#installing)
    
  - [Example](#example)

  - [License](#license)

## Installing

Using npm:

```bash
$ npm install @elytro/decoder
```

Using yarn:

```bash
$ yarn add @elytro/decoder
```

Using pnpm:

```bash
$ pnpm add @elytro/decoder
```

Once the package is installed, you can import the library using `import` approach:

```bash
import { Decoder } from "@elytro/decoder";
```

## Example

```typescript
import { ethers } from "ethers";
import { ABI_Elytro } from "@elytro/abi";
import { Decoder } from "@elytro/decoder";

async function main(): Promise<void> {
    let callData = '0x';
    const abi = new ethers.Interface(ABI_Elytro);
    let to: string[] = [
        '0xccaE58775FcBc01E0bB965Cc153363CD93e2d0f4',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    ];
    let value: string[] = [
        '11',
        '12'
    ];
    // encode erc20 transfer
    const erc20Interface = new ethers.Interface([
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]);
    let data: string[] = [
        '0x32',
        erc20Interface.encodeFunctionData("transfer", ['0x4521C9aD6A3D4230803aB752Ed238BE11F8B342F', '0xf'])
    ];
    if (to.length > 1) {
        if (value[0] !== '0x0') {
            callData = abi.encodeFunctionData("executeBatch(address[],uint256[],bytes[])", [to, value, data]);
        } else {
            callData = abi.encodeFunctionData("executeBatch(address[],bytes[])", [to, data]);
        }
    } else {
        callData = abi.encodeFunctionData("execute", [to[0], value[0], data[0]]);
    }
    const ret = await Decoder.decode(1, '0x1', '0x2', callData);
    if (ret.isErr()) {
        throw new Error(
            ret.ERR.message
        );
    }
    if (ret.OK.length !== 2) {
        throw new Error('result length error');
    }
    console.log(ret.OK);
}
```

- output
```json
[
    {
        "from": "0x1",
        "to": "0xccaE58775FcBc01E0bB965Cc153363CD93e2d0f4",
        "value": 11
    },
    {
        "from": "0x1",
        "method": {
            "bytes4": "0xa9059cbb",
            "name": "transfer",
            "params": [
                "0x4521C9aD6A3D4230803aB752Ed238BE11F8B342F",
                15
            ],
            "text": "transfer(address,uint256)"
        },
        "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "toInfo": {
            "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "chainId": 1,
            "decimals": 6,
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
            "name": "USDCoin",
            "symbol": "USDC"
        }
    }
]
```

## License

ISC
