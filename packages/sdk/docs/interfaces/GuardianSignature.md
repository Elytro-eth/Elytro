[@elytro/sdk](../README.md) / [Modules](../modules.md) / GuardianSignature

# Interface: GuardianSignature

## Table of contents

### Properties

- [address](GuardianSignature.md#address)
- [signature](GuardianSignature.md#signature)
- [signatureType](GuardianSignature.md#signaturetype)

## Properties

### address

• **address**: `string`

Guardian address

**`Memberof`**

GuardianSignature

#### Defined in

[packages/sdk/src/interface/ISocialRecovery.ts:16](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/ISocialRecovery.ts#L16)

___

### signature

• `Optional` **signature**: `string`

Signature

**`Memberof`**

GuardianSignature

#### Defined in

[packages/sdk/src/interface/ISocialRecovery.ts:24](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/ISocialRecovery.ts#L24)

___

### signatureType

• **signatureType**: ``0`` \| ``1`` \| ``2`` \| ``3``

0:EIP-1271 signature, 1:approved onchain before, 2:EOA signature, 3:No signature provided

**`Memberof`**

GuardianSignature

#### Defined in

[packages/sdk/src/interface/ISocialRecovery.ts:8](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/interface/ISocialRecovery.ts#L8)
