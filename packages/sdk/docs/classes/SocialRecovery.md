[@elytro/sdk](../README.md) / [Modules](../modules.md) / SocialRecovery

# Class: SocialRecovery

## Implements

- `ISocialRecovery`

## Table of contents

### Constructors

- [constructor](SocialRecovery.md#constructor)

### Properties

- [days](SocialRecovery.md#days)
- [defalutInitialGuardianSafePeriod](SocialRecovery.md#defalutinitialguardiansafeperiod)

### Methods

- [packSocialRecoveryEOASignature](SocialRecovery.md#packsocialrecoveryeoasignature)
- [packSocialRecoveryP256Signature](SocialRecovery.md#packsocialrecoveryp256signature)
- [packSocialRecoveryRS256Signature](SocialRecovery.md#packsocialrecoveryrs256signature)
- [addressToBytes32](SocialRecovery.md#addresstobytes32)
- [calcGuardianHash](SocialRecovery.md#calcguardianhash)
- [getGuardianBytes](SocialRecovery.md#getguardianbytes)
- [getKeyHash](SocialRecovery.md#getkeyhash)
- [getSocialRecoveryTypedData](SocialRecovery.md#getsocialrecoverytypeddata)
- [initialKeysToAddress](SocialRecovery.md#initialkeystoaddress)
- [packGuardianSignature](SocialRecovery.md#packguardiansignature)

## Constructors

### constructor

• **new SocialRecovery**(): [`SocialRecovery`](SocialRecovery.md)

#### Returns

[`SocialRecovery`](SocialRecovery.md)

## Properties

### days

▪ `Static` `Readonly` **days**: ``86400``

#### Defined in

[packages/sdk/src/socialRecovery.ts:12](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L12)

___

### defalutInitialGuardianSafePeriod

▪ `Static` `Readonly` **defalutInitialGuardianSafePeriod**: `number`

#### Defined in

[packages/sdk/src/socialRecovery.ts:13](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L13)

## Methods

### packSocialRecoveryEOASignature

▸ **packSocialRecoveryEOASignature**(`signature`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack SocialRecovery signature (EOA)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signature` | `string` | EOA signature |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

#### Defined in

[packages/sdk/src/socialRecovery.ts:347](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L347)

___

### packSocialRecoveryP256Signature

▸ **packSocialRecoveryP256Signature**(`signatureData`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack SocialRecovery signature (P256)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signatureData` | `Object` | signature data, messageHash is userOp hash(packed userOp hash) |
| `signatureData.authenticatorData` | `string` | - |
| `signatureData.clientDataSuffix` | `string` | - |
| `signatureData.messageHash` | `string` | - |
| `signatureData.publicKey` | `string` \| [`ECCPoint`](../interfaces/ECCPoint.md) | - |
| `signatureData.r` | `string` | - |
| `signatureData.s` | `string` | - |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

#### Defined in

[packages/sdk/src/socialRecovery.ts:367](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L367)

___

### packSocialRecoveryRS256Signature

▸ **packSocialRecoveryRS256Signature**(`signatureData`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack SocialRecovery signature (RS256)

#### Parameters

| Name | Type |
| :------ | :------ |
| `signatureData` | `Object` |
| `signatureData.authenticatorData` | `string` |
| `signatureData.clientDataSuffix` | `string` |
| `signatureData.messageHash` | `string` |
| `signatureData.publicKey` | [`RSAPublicKey`](../interfaces/RSAPublicKey.md) |
| `signatureData.signature` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

#### Defined in

[packages/sdk/src/socialRecovery.ts:395](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L395)

___

### addressToBytes32

▸ **addressToBytes32**(`address`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`string`

#### Defined in

[packages/sdk/src/socialRecovery.ts:258](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L258)

___

### calcGuardianHash

▸ **calcGuardianHash**(`guardians`, `threshold`, `salt?`): `string`

calculate the guardian hash

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `guardians` | `string`[] | `undefined` | EOA/Smart contract address array (auto sort) |
| `threshold` | `number` | `undefined` |  |
| `salt` | `string` | `ethers.ZeroHash` | hex string (bytes32),default is 0 |

#### Returns

`string`

{string} keccak256 hash of the guardian set

**`Abstract`**

**`Memberof`**

SocialRecovery

#### Defined in

[packages/sdk/src/socialRecovery.ts:125](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L125)

___

### getGuardianBytes

▸ **getGuardianBytes**(`guardians`, `threshold`, `salt?`): `string`

pack guardian info into bytes

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `guardians` | `string`[] | `undefined` | EOA/Smart contract address array (auto sort) |
| `threshold` | `number` | `undefined` |  |
| `salt` | `string` | `ethers.ZeroHash` | hex string (bytes32),default is 0 |

#### Returns

`string`

{string} keccak256 hash of the guardian set

**`Memberof`**

SocialRecovery

#### Defined in

[packages/sdk/src/socialRecovery.ts:77](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L77)

___

### getKeyHash

▸ **getKeyHash**(`keys`): `string`

calculate the key hash

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `keys` | `string`[] | result of initialKeysToAddress |

#### Returns

`string`

{string} bytes32

**`Static`**

**`Memberof`**

SocialRecovery

#### Defined in

[packages/sdk/src/socialRecovery.ts:58](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L58)

___

### getSocialRecoveryTypedData

▸ **getSocialRecoveryTypedData**(`chainId`, `socialRecoveryContract`, `walletAddress`, `nonce`, `newOwners`): `Object`

Get EIP-712 typed data for social recovery

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | chainId |
| `socialRecoveryContract` | `string` | socialRecoveryContract address |
| `walletAddress` | `string` | wallet address |
| `nonce` | `number` | uint256 nonce |
| `newOwners` | `string`[] | - |

#### Returns

`Object`

{{
        domain: TypedDataDomain,
        types: Record<string, Array<TypedDataField>>,
        value: Record<string, any>,
        typedMessage: string
    }}

| Name | Type |
| :------ | :------ |
| `domain` | `TypedDataDomain` |
| `message` | `Record`\<`string`, `any`\> |
| `primaryType` | `string` |
| `typedMessage` | `string` |
| `types` | `Record`\<`string`, `TypedDataField`[]\> |

**`Static`**

**`Memberof`**

socialRecovery

#### Defined in

[packages/sdk/src/socialRecovery.ts:289](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L289)

___

### initialKeysToAddress

▸ **initialKeysToAddress**(`initialKeys`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `initialKeys` | [`InitialKey`](../modules.md#initialkey)[] |

#### Returns

`string`[]

#### Defined in

[packages/sdk/src/socialRecovery.ts:17](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L17)

___

### packGuardianSignature

▸ **packGuardianSignature**(`guardianSignature`): `string`

pack guardian signatures into `guardianSignature` bytes

#### Parameters

| Name | Type |
| :------ | :------ |
| `guardianSignature` | [`GuardianSignature`](../interfaces/GuardianSignature.md)[] |

#### Returns

`string`

{string}

**`Static`**

**`Memberof`**

SocialRecovery

#### Defined in

[packages/sdk/src/socialRecovery.ts:145](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/socialRecovery.ts#L145)
