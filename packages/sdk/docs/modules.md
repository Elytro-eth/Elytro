[@elytro/sdk](README.md) / Modules

# @elytro/sdk

## Table of contents

### Enumerations

- [SignkeyType](enums/SignkeyType.md)

### Classes

- [Base64Url](classes/Base64Url.md)
- [Bundler](classes/Bundler.md)
- [ElytroWallet](classes/ElytroWallet.md)
- [Err](classes/Err.md)
- [Ok](classes/Ok.md)
- [P256Lib](classes/P256Lib.md)
- [SocialRecovery](classes/SocialRecovery.md)
- [UserOpErrorCodes](classes/UserOpErrorCodes.md)
- [UserOpErrors](classes/UserOpErrors.md)
- [UserOpUtils](classes/UserOpUtils.md)
- [WalletFactory](classes/WalletFactory.md)
- [WebAuthN](classes/WebAuthN.md)

### Interfaces

- [ECCPoint](interfaces/ECCPoint.md)
- [GuardianSignature](interfaces/GuardianSignature.md)
- [RSAPublicKey](interfaces/RSAPublicKey.md)
- [Transaction](interfaces/Transaction.md)
- [UserOpDetail](interfaces/UserOpDetail.md)
- [UserOpGas](interfaces/UserOpGas.md)
- [UserOpReceipt](interfaces/UserOpReceipt.md)

### Type Aliases

- [Address](modules.md#address)
- [BigNumberish](modules.md#bignumberish)
- [Bytes32](modules.md#bytes32)
- [HexString](modules.md#hexstring)
- [InitialKey](modules.md#initialkey)
- [PackedUserOperation](modules.md#packeduseroperation)
- [Result](modules.md#result)
- [UserOperation](modules.md#useroperation)

## Type Aliases

### Address

Ƭ **Address**: `string`

#### Defined in

[packages/sdk/src/interface/types.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/types.ts#L3)

___

### BigNumberish

Ƭ **BigNumberish**: `string` \| `Numeric`

#### Defined in

[packages/sdk/src/interface/types.ts:2](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/types.ts#L2)

___

### Bytes32

Ƭ **Bytes32**: [`HexString`](modules.md#hexstring)

#### Defined in

[packages/sdk/src/interface/types.ts:5](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/types.ts#L5)

___

### HexString

Ƭ **HexString**: `string`

#### Defined in

[packages/sdk/src/interface/types.ts:4](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/types.ts#L4)

___

### InitialKey

Ƭ **InitialKey**: [`ECCPoint`](interfaces/ECCPoint.md) \| [`RSAPublicKey`](interfaces/RSAPublicKey.md) \| `string`

Initial key of the wallet
ECCPoint, RSAPublicKey, EOA or packed bytes32

#### Defined in

[packages/sdk/src/interface/IElytroWallet.ts:242](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/IElytroWallet.ts#L242)

___

### PackedUserOperation

Ƭ **PackedUserOperation**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accountGasLimits` | [`Bytes32`](modules.md#bytes32) |
| `callData` | [`HexString`](modules.md#hexstring) |
| `gasFees` | [`Bytes32`](modules.md#bytes32) |
| `initCode` | [`HexString`](modules.md#hexstring) |
| `nonce` | [`BigNumberish`](modules.md#bignumberish) |
| `paymasterAndData` | [`HexString`](modules.md#hexstring) |
| `preVerificationGas` | [`BigNumberish`](modules.md#bignumberish) |
| `sender` | [`Address`](modules.md#address) |
| `signature` | [`HexString`](modules.md#hexstring) |

#### Defined in

[packages/sdk/src/interface/UserOperation.ts:22](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/UserOperation.ts#L22)

___

### Result

Ƭ **Result**\<`T`, `E`\>: [`Ok`](classes/Ok.md)\<`T`, `E`\> \| [`Err`](classes/Err.md)\<`T`, `E`\>

Defines a Result type, which can be either Ok or Err.

#### Type parameters

| Name |
| :------ |
| `T` |
| `E` |

#### Defined in

packages/result/lib.esm/Result.d.ts:4

___

### UserOperation

Ƭ **UserOperation**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callData` | [`HexString`](modules.md#hexstring) |
| `callGasLimit` | [`BigNumberish`](modules.md#bignumberish) |
| `factory` | [`Address`](modules.md#address) \| ``null`` |
| `factoryData` | [`HexString`](modules.md#hexstring) \| ``null`` |
| `maxFeePerGas` | [`BigNumberish`](modules.md#bignumberish) |
| `maxPriorityFeePerGas` | [`BigNumberish`](modules.md#bignumberish) |
| `nonce` | [`BigNumberish`](modules.md#bignumberish) |
| `paymaster` | [`Address`](modules.md#address) \| ``null`` |
| `paymasterData` | [`HexString`](modules.md#hexstring) \| ``null`` |
| `paymasterPostOpGasLimit` | [`BigNumberish`](modules.md#bignumberish) \| ``null`` |
| `paymasterVerificationGasLimit` | [`BigNumberish`](modules.md#bignumberish) \| ``null`` |
| `preVerificationGas` | [`BigNumberish`](modules.md#bignumberish) |
| `sender` | [`Address`](modules.md#address) |
| `signature` | [`HexString`](modules.md#hexstring) |
| `verificationGasLimit` | [`BigNumberish`](modules.md#bignumberish) |

#### Defined in

[packages/sdk/src/interface/UserOperation.ts:4](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/UserOperation.ts#L4)
