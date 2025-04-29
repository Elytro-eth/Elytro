[@elytro/keyvault](../README.md) / [Modules](../modules.md) / Err

# Class: Err\<T, E\>

Defines an Err class, representing a failed operation result.

**`Export`**

Err

## Type parameters

| Name |
| :------ |
| `T` |
| `E` |

## Table of contents

### Constructors

- [constructor](Err.md#constructor)

### Properties

- [\_error](Err.md#_error)

### Accessors

- [ERR](Err.md#err)
- [OK](Err.md#ok)

### Methods

- [isErr](Err.md#iserr)
- [isOk](Err.md#isok)

## Constructors

### constructor

• **new Err**\<`T`, `E`\>(`error`): [`Err`](Err.md)\<`T`, `E`\>

Creates an instance of Err.

#### Type parameters

| Name |
| :------ |
| `T` |
| `E` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `E` |

#### Returns

[`Err`](Err.md)\<`T`, `E`\>

**`Memberof`**

Err

#### Defined in

result/lib.esm/Result.d.ts:67

## Properties

### \_error

• `Private` `Readonly` **\_error**: `any`

#### Defined in

result/lib.esm/Result.d.ts:61

## Accessors

### ERR

• `get` **ERR**(): `E`

Gets the error.

#### Returns

`E`

**`Memberof`**

Err

#### Defined in

result/lib.esm/Result.d.ts:83

___

### OK

• `get` **OK**(): `T`

Gets the successful result value.

#### Returns

`T`

**`Memberof`**

Err

#### Defined in

result/lib.esm/Result.d.ts:75

## Methods

### isErr

▸ **isErr**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Err

#### Defined in

result/lib.esm/Result.d.ts:97

___

### isOk

▸ **isOk**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Err

#### Defined in

result/lib.esm/Result.d.ts:90
