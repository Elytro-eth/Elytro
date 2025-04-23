[@elytro/decoder](../README.md) / [Modules](../modules.md) / DecodeResult

# Interface: DecodeResult

DecodeResult is the interface for the decode result.

**`Export`**

DecodeResult

## Table of contents

### Properties

- [from](DecodeResult.md#from)
- [fromInfo](DecodeResult.md#frominfo)
- [method](DecodeResult.md#method)
- [to](DecodeResult.md#to)
- [toInfo](DecodeResult.md#toinfo)
- [value](DecodeResult.md#value)

## Properties

### from

• **from**: `string`

The from address.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:57](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L57)

___

### fromInfo

• `Optional` **fromInfo**: [`TokenInfo`](TokenInfo.md)

The token information of the from address.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:65](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L65)

___

### method

• `Optional` **method**: [`Method`](Method.md)

The method.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:97](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L97)

___

### to

• **to**: `string`

The to address.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:73](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L73)

___

### toInfo

• `Optional` **toInfo**: [`TokenInfo`](TokenInfo.md)

The token information of the to address.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:81](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L81)

___

### value

• **value**: `bigint`

The eth value.

**`Memberof`**

DecodeResult

#### Defined in

[decoder/src/interface/decodeData.ts:89](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/decoder/src/interface/decodeData.ts#L89)
