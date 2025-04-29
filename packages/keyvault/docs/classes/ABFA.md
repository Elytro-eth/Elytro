[@elytro/keyvault](../README.md) / [Modules](../modules.md) / ABFA

# Class: ABFA

Anti-Brute-Force Algorithm

**`Export`**

ABFA

## Table of contents

### Constructors

- [constructor](ABFA.md#constructor)

### Methods

- [argon2id](ABFA.md#argon2id)
- [scrypt](ABFA.md#scrypt)

## Constructors

### constructor

• **new ABFA**(): [`ABFA`](ABFA.md)

#### Returns

[`ABFA`](ABFA.md)

## Methods

### argon2id

▸ **argon2id**(`password`, `salt`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `password` | `string` |
| `salt` | `string` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[keyvault/src/crypto.ts:238](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/crypto.ts#L238)

___

### scrypt

▸ **scrypt**(`password`, `salt?`, `N?`, `r?`, `p?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `password` | `string` | `undefined` |
| `salt` | `string` | `scryptConfig.salt` |
| `N` | `number` | `scryptConfig.N` |
| `r` | `number` | `scryptConfig.r` |
| `p` | `number` | `scryptConfig.p` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Defined in

[keyvault/src/crypto.ts:215](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/crypto.ts#L215)
