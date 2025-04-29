[@elytro/keyvault](README.md) / Modules

# @elytro/keyvault

## Table of contents

### Classes

- [ABFA](classes/ABFA.md)
- [Err](classes/Err.md)
- [Ok](classes/Ok.md)
- [Vault](classes/Vault.md)

### Interfaces

- [SignData](interfaces/SignData.md)

### Type Aliases

- [Result](modules.md#result)
- [VaultEvents](modules.md#vaultevents)

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

___

### VaultEvents

Ƭ **VaultEvents**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `AccountAdded` | `string` |
| `AccountRemoved` | `string` |
| `Initialized` | `void` |
| `Locked` | `void` |
| `PersonalSign` | [`SignData`](interfaces/SignData.md) |
| `Ping` | `void` |
| `ReInitialized` | `void` |
| `Sign` | [`SignData`](interfaces/SignData.md) |
| `TypedDataSign` | [`SignData`](interfaces/SignData.md) |
| `Unlocked` | `void` |

#### Defined in

[keyvault/src/interface/IVault.ts:10](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/interface/IVault.ts#L10)
