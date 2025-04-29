[@elytro/result](../README.md) / [Modules](../modules.md) / Ok

# Class: Ok\<T, E\>

Defines an Ok class, representing a successful operation result.

**`Export`**

Ok

## Type parameters

| Name |
| :------ |
| `T` |
| `E` |

## Table of contents

### Constructors

- [constructor](Ok.md#constructor)

### Properties

- [\_value](Ok.md#_value)

### Accessors

- [ERR](Ok.md#err)
- [OK](Ok.md#ok)

### Methods

- [isErr](Ok.md#iserr)
- [isOk](Ok.md#isok)

## Constructors

### constructor

• **new Ok**\<`T`, `E`\>(`value`): [`Ok`](Ok.md)\<`T`, `E`\>

Creates an instance of Ok.

#### Type parameters

| Name |
| :------ |
| `T` |
| `E` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

[`Ok`](Ok.md)\<`T`, `E`\>

**`Memberof`**

Ok

#### Defined in

[Result.ts:22](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L22)

## Properties

### \_value

• `Private` `Readonly` **\_value**: `undefined` \| `T` = `undefined`

#### Defined in

[Result.ts:15](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L15)

## Accessors

### ERR

• `get` **ERR**(): `E`

Gets the error.

#### Returns

`E`

**`Memberof`**

Ok

#### Defined in

[Result.ts:44](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L44)

___

### OK

• `get` **OK**(): `T`

Gets the successful result value.

#### Returns

`T`

**`Memberof`**

Ok

#### Defined in

[Result.ts:33](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L33)

## Methods

### isErr

▸ **isErr**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Ok

#### Defined in

[Result.ts:64](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L64)

___

### isOk

▸ **isOk**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Ok

#### Defined in

[Result.ts:54](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/result/src/Result.ts#L54)
