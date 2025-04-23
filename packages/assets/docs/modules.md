[@elytro/assets](README.md) / Modules

# @elytro/assets

## Table of contents

### Enumerations

- [AddressType](enums/AddressType.md)

### Classes

- [Err](classes/Err.md)
- [Ok](classes/Ok.md)

### Interfaces

- [TokenInfo](interfaces/TokenInfo.md)

### Type Aliases

- [Result](modules.md#result)

### Functions

- [getAsset](modules.md#getasset)

## Type Aliases

### Result

Ƭ **Result**\<`T`, `E`\>: [`Ok`](classes/Ok.md)\<`T`, `E`\> \| [`Err`](classes/Err.md)\<`T`, `E`\>

Defines a Result type, which can be either Ok or Err.

#### Type parameters

| Name |
| :------ |
| `T` |
| `E` |

#### Defined in

result/lib.esm/Result.d.ts:4

## Functions

### getAsset

▸ **getAsset**(`chainId`, `address`): `Promise`\<[`Result`](modules.md#result)\<[`TokenInfo`](interfaces/TokenInfo.md), `Error`\>\>

Get the token information from the token list.

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `address` | `string` |

#### Returns

`Promise`\<[`Result`](modules.md#result)\<[`TokenInfo`](interfaces/TokenInfo.md), `Error`\>\>

{Promise<Result<TokenInfo, Error>>}

#### Defined in

[assets/src/asset.ts:14](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/assets/src/asset.ts#L14)
