[@elytro/decoder](../README.md) / [Modules](../modules.md) / Ok

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

result/lib.esm/Result.d.ts:20

## Properties

### \_value

• `Private` `Readonly` **\_value**: `any`

#### Defined in

result/lib.esm/Result.d.ts:14

## Accessors

### ERR

• `get` **ERR**(): `E`

Gets the error.

#### Returns

`E`

**`Memberof`**

Ok

#### Defined in

result/lib.esm/Result.d.ts:36

___

### OK

• `get` **OK**(): `T`

Gets the successful result value.

#### Returns

`T`

**`Memberof`**

Ok

#### Defined in

result/lib.esm/Result.d.ts:28

## Methods

### isErr

▸ **isErr**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Ok

#### Defined in

result/lib.esm/Result.d.ts:50

___

### isOk

▸ **isOk**(): `boolean`

#### Returns

`boolean`

{boolean}

**`Memberof`**

Ok

#### Defined in

result/lib.esm/Result.d.ts:43
