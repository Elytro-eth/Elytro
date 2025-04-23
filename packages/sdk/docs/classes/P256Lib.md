[@elytro/sdk](../README.md) / [Modules](../modules.md) / P256Lib

# Class: P256Lib

## Table of contents

### Constructors

- [constructor](P256Lib.md#constructor)

### Methods

- [FCL\_nModInv](P256Lib.md#fcl_nmodinv)
- [FCL\_pModInv](P256Lib.md#fcl_pmodinv)
- [ShamirMultJacobian](P256Lib.md#shamirmultjacobian)
- [SqrtMod](P256Lib.md#sqrtmod)
- [VerifyWithPrecompute](P256Lib.md#verifywithprecompute)
- [\_affineFromJacobian](P256Lib.md#_affinefromjacobian)
- [\_jPointAdd](P256Lib.md#_jpointadd)
- [\_jPointDouble](P256Lib.md#_jpointdouble)
- [\_preComputeJacobianPoints](P256Lib.md#_precomputejacobianpoints)
- [\_primemod](P256Lib.md#_primemod)
- [addmod](P256Lib.md#addmod)
- [ecAff\_IsZero](P256Lib.md#ecaff_iszero)
- [ecAff\_add](P256Lib.md#ecaff_add)
- [ecZZ\_AddN](P256Lib.md#eczz_addn)
- [ecZZ\_SetAff](P256Lib.md#eczz_setaff)
- [ecZZ\_mulmuladd](P256Lib.md#eczz_mulmuladd)
- [ec\_Decompress](P256Lib.md#ec_decompress)
- [ec\_recover\_r1](P256Lib.md#ec_recover_r1)
- [modexp](P256Lib.md#modexp)
- [mulmod](P256Lib.md#mulmod)
- [verify](P256Lib.md#verify)

## Constructors

### constructor

• **new P256Lib**(): [`P256Lib`](P256Lib.md)

#### Returns

[`P256Lib`](P256Lib.md)

## Methods

### FCL\_nModInv

▸ **FCL_nModInv**(`u`): `bigint`

/* inversion mod n via a^(n-2), use of precompiled using little Fermat theorem

#### Parameters

| Name | Type |
| :------ | :------ |
| `u` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:88](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L88)

___

### FCL\_pModInv

▸ **FCL_pModInv**(`u`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `u` | `bigint` |

#### Returns

`bigint`

**`Dev`**

inversion mod nusing little Fermat theorem via a^(n-2), use of precompiled

#### Defined in

[packages/sdk/src/tools/p256lib.ts:94](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L94)

___

### ShamirMultJacobian

▸ **ShamirMultJacobian**(`points`, `u1`, `u2`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `points` | `JPoint`[] |
| `u1` | `bigint` |
| `u2` | `bigint` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `x` | `bigint` |
| `y` | `bigint` |

#### Defined in

[packages/sdk/src/tools/p256lib.ts:508](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L508)

___

### SqrtMod

▸ **SqrtMod**(`self`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `self` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:102](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L102)

___

### VerifyWithPrecompute

▸ **VerifyWithPrecompute**(`points`, `r`, `s`, `h`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `points` | `JPoint`[] |
| `r` | `bigint` |
| `s` | `bigint` |
| `h` | `bigint` |

#### Returns

`boolean`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:532](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L532)

___

### \_affineFromJacobian

▸ **_affineFromJacobian**(`point`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `point` | `JPoint` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `x` | `bigint` |
| `y` | `bigint` |

#### Defined in

[packages/sdk/src/tools/p256lib.ts:482](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L482)

___

### \_jPointAdd

▸ **_jPointAdd**(`_p1`, `_p2`): `JPoint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_p1` | `JPoint` |
| `_p2` | `JPoint` |

#### Returns

`JPoint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:365](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L365)

___

### \_jPointDouble

▸ **_jPointDouble**(`point`): `JPoint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `point` | `JPoint` |

#### Returns

`JPoint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:329](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L329)

___

### \_preComputeJacobianPoints

▸ **_preComputeJacobianPoints**(`pubKeyX`, `pubKeyY`): `JPoint`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `pubKeyX` | `bigint` |
| `pubKeyY` | `bigint` |

#### Returns

`JPoint`[]

#### Defined in

[packages/sdk/src/tools/p256lib.ts:438](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L438)

___

### \_primemod

▸ **_primemod**(`_base`, `_mod`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_base` | `bigint` |
| `_mod` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:467](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L467)

___

### addmod

▸ **addmod**(`a`, `b`, `m`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `bigint` |
| `b` | `bigint` |
| `m` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:81](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L81)

___

### ecAff\_IsZero

▸ **ecAff_IsZero**(`y`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `y` | `bigint` |

#### Returns

`boolean`

**`Dev`**

Check if the curve is the zero curve in affine rep.

#### Defined in

[packages/sdk/src/tools/p256lib.ts:170](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L170)

___

### ecAff\_add

▸ **ecAff_add**(`p1`, `p2`): `Point`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p1` | `Point` |
| `p2` | `Point` |

#### Returns

`Point`

**`Dev`**

Add two elliptic curve points in affine coordinates.

#### Defined in

[packages/sdk/src/tools/p256lib.ts:178](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L178)

___

### ecZZ\_AddN

▸ **ecZZ_AddN**(`zzPoint`, `point`): `ZZPoint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `zzPoint` | `ZZPoint` |
| `point` | `Point` |

#### Returns

`ZZPoint`

**`Dev`**

Sutherland2008 add a ZZ point with a normalized point and greedy formulae
warning: assume that P1(x1,y1)!=P2(x2,y2), true in multiplication loop with prime order (cofactor 1)

#### Defined in

[packages/sdk/src/tools/p256lib.ts:143](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L143)

___

### ecZZ\_SetAff

▸ **ecZZ_SetAff**(`p1`): `Point`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p1` | `ZZPoint` |

#### Returns

`Point`

**`Dev`**

Convert from XYZZ rep to affine rep
/*    https://hyperelliptic.org/EFD/g1p/auto-shortw-xyzz-3.html#addition-add-2008-s

#### Defined in

[packages/sdk/src/tools/p256lib.ts:129](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L129)

___

### ecZZ\_mulmuladd

▸ **ecZZ_mulmuladd**(`point`, `scalar_u`, `scalar_v`): `Point`

#### Parameters

| Name | Type |
| :------ | :------ |
| `point` | `Point` |
| `scalar_u` | `bigint` |
| `scalar_v` | `bigint` |

#### Returns

`Point`

**`Dev`**

Computation of uG+vQ using Strauss-Shamir's trick, G basepoint, Q public key
      Returns affine representation of point (normalized)

#### Defined in

[packages/sdk/src/tools/p256lib.ts:189](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L189)

___

### ec\_Decompress

▸ **ec_Decompress**(`x`, `parity`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `bigint` |
| `parity` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:112](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L112)

___

### ec\_recover\_r1

▸ **ec_recover_r1**(`h`, `v`, `r`, `s`): `Point`

#### Parameters

| Name | Type |
| :------ | :------ |
| `h` | `bigint` |
| `v` | `bigint` |
| `r` | `bigint` |
| `s` | `bigint` |

#### Returns

`Point`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:311](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L311)

___

### modexp

▸ **modexp**(`base`, `exponent`, `modulus`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `bigint` |
| `exponent` | `bigint` |
| `modulus` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:63](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L63)

___

### mulmod

▸ **mulmod**(`a`, `b`, `m`): `bigint`

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `bigint` |
| `b` | `bigint` |
| `m` | `bigint` |

#### Returns

`bigint`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:78](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L78)

___

### verify

▸ **verify**(`pubKeyX`, `pubKeyY`, `h`, `r`, `s`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pubKeyX` | `bigint` |
| `pubKeyY` | `bigint` |
| `h` | `bigint` |
| `r` | `bigint` |
| `s` | `bigint` |

#### Returns

`boolean`

#### Defined in

[packages/sdk/src/tools/p256lib.ts:545](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/tools/p256lib.ts#L545)
