[@elytro/sdk](../README.md) / [Modules](../modules.md) / ElytroWallet

# Class: ElytroWallet

main class of the SDK.

**`Export`**

ElytroWallet

**`Implements`**

## Implements

- `IElytroWallet`

## Table of contents

### Constructors

- [constructor](ElytroWallet.md#constructor)

### Properties

- [Bundler](ElytroWallet.md#bundler)
- [\_entryPointContract](ElytroWallet.md#_entrypointcontract)
- [\_onChainConfig](ElytroWallet.md#_onchainconfig)
- [bundler](ElytroWallet.md#bundler-1)
- [defalutCallbackHandlerAddress](ElytroWallet.md#defalutcallbackhandleraddress)
- [elytroWalletFactoryAddress](ElytroWallet.md#elytrowalletfactoryaddress)
- [preVerificationGasDeploy](ElytroWallet.md#preverificationgasdeploy)
- [provider](ElytroWallet.md#provider)
- [socialRecoveryModuleAddress](ElytroWallet.md#socialrecoverymoduleaddress)

### Methods

- [calcWalletAddress](ElytroWallet.md#calcwalletaddress)
- [createUnsignedDeployWalletUserOp](ElytroWallet.md#createunsigneddeploywalletuserop)
- [entryPoint](ElytroWallet.md#entrypoint)
- [estimateUserOperationGas](ElytroWallet.md#estimateuseroperationgas)
- [fromTransaction](ElytroWallet.md#fromtransaction)
- [getEIP1271TypedData](ElytroWallet.md#geteip1271typeddata)
- [getEntryPointContract](ElytroWallet.md#getentrypointcontract)
- [getNonce](ElytroWallet.md#getnonce)
- [getOnChainConfig](ElytroWallet.md#getonchainconfig)
- [getSemiValidSignature](ElytroWallet.md#getsemivalidsignature)
- [guardHookList](ElytroWallet.md#guardhooklist)
- [initializeData](ElytroWallet.md#initializedata)
- [packRawHash](ElytroWallet.md#packrawhash)
- [packUserOpEOASignature](ElytroWallet.md#packuseropeoasignature)
- [packUserOpHash](ElytroWallet.md#packuserophash)
- [packUserOpP256Signature](ElytroWallet.md#packuseropp256signature)
- [packUserOpRS256Signature](ElytroWallet.md#packuseroprs256signature)
- [preFund](ElytroWallet.md#prefund)
- [prePackUserOpSignature](ElytroWallet.md#prepackuseropsignature)
- [sendUserOperation](ElytroWallet.md#senduseroperation)
- [userOpHash](ElytroWallet.md#userophash)
- [walletDeployed](ElytroWallet.md#walletdeployed)
- [initializeData](ElytroWallet.md#initializedata-1)

## Constructors

### constructor

• **new ElytroWallet**(`_provider`, `_bundler`, `_elytroWalletFactoryAddress`, `_defalutCallbackHandlerAddress?`, `_socialRecoveryModuleAddress?`, `_config?`): [`ElytroWallet`](ElytroWallet.md)

Creates an instance of ElytroWallet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `_provider` | `string` \| `JsonRpcProvider` | ethreum client rpc url |
| `_bundler` | `string` \| `JsonRpcProvider` | eip-4337 bundler rpc url |
| `_elytroWalletFactoryAddress` | `string` | elytroWalletFactory contract address |
| `_defalutCallbackHandlerAddress?` | `string` | default callback handler contract address |
| `_socialRecoveryModuleAddress?` | `string` | social recovery module contract address |
| `_config?` | `onChainConfig` | if provided, skip onchain config check |

#### Returns

[`ElytroWallet`](ElytroWallet.md)

**`Memberof`**

ElytroWallet

#### Defined in

[packages/sdk/src/elytroWallet.ts:54](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L54)

## Properties

### Bundler

• `Readonly` **Bundler**: [`Bundler`](Bundler.md)

#### Defined in

[packages/sdk/src/elytroWallet.ts:41](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L41)

___

### \_entryPointContract

• `Private` **\_entryPointContract**: `undefined` \| `Contract`

#### Defined in

[packages/sdk/src/elytroWallet.ts:184](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L184)

___

### \_onChainConfig

• `Private` **\_onChainConfig**: `undefined` \| `onChainConfig` = `undefined`

#### Defined in

[packages/sdk/src/elytroWallet.ts:42](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L42)

___

### bundler

• `Readonly` **bundler**: `JsonRpcProvider`

#### Defined in

[packages/sdk/src/elytroWallet.ts:36](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L36)

___

### defalutCallbackHandlerAddress

• `Optional` `Readonly` **defalutCallbackHandlerAddress**: `string`

#### Defined in

[packages/sdk/src/elytroWallet.ts:38](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L38)

___

### elytroWalletFactoryAddress

• `Readonly` **elytroWalletFactoryAddress**: `string`

#### Defined in

[packages/sdk/src/elytroWallet.ts:37](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L37)

___

### preVerificationGasDeploy

• `Readonly` **preVerificationGasDeploy**: `number` = `10000000`

#### Defined in

[packages/sdk/src/elytroWallet.ts:40](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L40)

___

### provider

• `Readonly` **provider**: `JsonRpcProvider`

#### Defined in

[packages/sdk/src/elytroWallet.ts:35](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L35)

___

### socialRecoveryModuleAddress

• `Optional` `Readonly` **socialRecoveryModuleAddress**: `string`

#### Defined in

[packages/sdk/src/elytroWallet.ts:39](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L39)

## Methods

### calcWalletAddress

▸ **calcWalletAddress**(`index`, `initialKeys`, `initialGuardianHash`, `initialGuardianSafePeriod?`, `chainId?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

get wallet address by index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | readable index |
| `initialKeys` | [`InitialKey`](../modules.md#initialkey)[] | initial keys |
| `initialGuardianHash` | `string` | initial guardian hash |
| `initialGuardianSafePeriod?` | `number` | initial guardian safe period |
| `chainId?` | `string` \| `number` | number or hex string(must start with 0x) |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

**`Memberof`**

ElytroWallet

#### Implementation of

IElytroWallet.calcWalletAddress

#### Defined in

[packages/sdk/src/elytroWallet.ts:272](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L272)

___

### createUnsignedDeployWalletUserOp

▸ **createUnsignedDeployWalletUserOp**(`index`, `initialKeys`, `initialGuardianHash`, `callData?`, `initialGuardianSafePeriod?`): `Promise`\<[`Result`](../modules.md#result)\<[`UserOperation`](../modules.md#useroperation), `Error`\>\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `index` | `number` | `undefined` |
| `initialKeys` | [`InitialKey`](../modules.md#initialkey)[] | `undefined` |
| `initialGuardianHash` | `string` | `undefined` |
| `callData` | `string` | `"0x"` |
| `initialGuardianSafePeriod?` | `number` | `undefined` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`UserOperation`](../modules.md#useroperation), `Error`\>\>

#### Implementation of

IElytroWallet.createUnsignedDeployWalletUserOp

#### Defined in

[packages/sdk/src/elytroWallet.ts:352](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L352)

___

### entryPoint

▸ **entryPoint**(): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Implementation of

IElytroWallet.entryPoint

#### Defined in

[packages/sdk/src/elytroWallet.ts:197](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L197)

___

### estimateUserOperationGas

▸ **estimateUserOperationGas**(`validatorAddress`, `userOp`, `stateOverride?`, `signkeyType?`, `semiValidGuardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<[`UserOpGas`](../interfaces/UserOpGas.md), [`UserOpErrors`](UserOpErrors.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `validatorAddress` | `string` |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |
| `stateOverride?` | `Record`\<`string`, `StateOverride`\> |
| `signkeyType?` | [`SignkeyType`](../enums/SignkeyType.md) |
| `semiValidGuardHookInputData?` | `GuardHookInputData` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`UserOpGas`](../interfaces/UserOpGas.md), [`UserOpErrors`](UserOpErrors.md)\>\>

#### Implementation of

IElytroWallet.estimateUserOperationGas

#### Defined in

[packages/sdk/src/elytroWallet.ts:631](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L631)

___

### fromTransaction

▸ **fromTransaction**(`maxFeePerGas`, `maxPriorityFeePerGas`, `from`, `txs`, `nonce?`): `Promise`\<[`Result`](../modules.md#result)\<[`UserOperation`](../modules.md#useroperation), `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `maxFeePerGas` | `string` |
| `maxPriorityFeePerGas` | `string` |
| `from` | `string` |
| `txs` | [`Transaction`](../interfaces/Transaction.md)[] |
| `nonce?` | `Object` |
| `nonce.nonceKey?` | `string` |
| `nonce.nonceValue?` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`UserOperation`](../modules.md#useroperation), `Error`\>\>

#### Implementation of

IElytroWallet.fromTransaction

#### Defined in

[packages/sdk/src/elytroWallet.ts:758](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L758)

___

### getEIP1271TypedData

▸ **getEIP1271TypedData**(`walletAddr`, `message`): `Promise`\<[`Result`](../modules.md#result)\<\{ `domain`: `TypedDataDomain` ; `typedMessage`: `string` ; `types`: `Record`\<`string`, `TypedDataField`[]\> ; `value`: `Record`\<`string`, `any`\>  }, `Error`\>\>

get TypedData from EIP1271.

#### Parameters

| Name | Type |
| :------ | :------ |
| `walletAddr` | `string` |
| `message` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<\{ `domain`: `TypedDataDomain` ; `typedMessage`: `string` ; `types`: `Record`\<`string`, `TypedDataField`[]\> ; `value`: `Record`\<`string`, `any`\>  }, `Error`\>\>

{Promise<Result<{
        domain: TypedDataDomain,
        types: Record<string, Array<TypedDataField>>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: Record<string, any>,
        typedMessage: string
    }, Error>>}

**`Abstract`**

**`Memberof`**

IElytroWallet

#### Implementation of

IElytroWallet.getEIP1271TypedData

#### Defined in

[packages/sdk/src/elytroWallet.ts:905](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L905)

___

### getEntryPointContract

▸ **getEntryPointContract**(): `Promise`\<[`Result`](../modules.md#result)\<`Contract`, `Error`\>\>

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`Contract`, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:186](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L186)

___

### getNonce

▸ **getNonce**(`walletAddr`, `key?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `walletAddr` | `string` |
| `key?` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Implementation of

IElytroWallet.getNonce

#### Defined in

[packages/sdk/src/elytroWallet.ts:701](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L701)

___

### getOnChainConfig

▸ **getOnChainConfig**(): `Promise`\<[`Result`](../modules.md#result)\<`onChainConfig`, `Error`\>\>

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`onChainConfig`, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:93](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L93)

___

### getSemiValidSignature

▸ **getSemiValidSignature**(`validatorAddress`, `userOp`, `signkeyType?`, `semiValidGuardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, [`UserOpErrors`](UserOpErrors.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `validatorAddress` | `string` |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |
| `signkeyType?` | [`SignkeyType`](../enums/SignkeyType.md) |
| `semiValidGuardHookInputData?` | `GuardHookInputData` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, [`UserOpErrors`](UserOpErrors.md)\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:570](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L570)

___

### guardHookList

▸ **guardHookList**(`walletAddress`): `Promise`\<[`Result`](../modules.md#result)\<`string`[], `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `walletAddress` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`[], `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:441](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L441)

___

### initializeData

▸ **initializeData**(`initialKeys`, `initialGuardianHash?`, `initialGuardianSafePeriod?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `initialKeys` | [`InitialKey`](../modules.md#initialkey)[] | `undefined` |
| `initialGuardianHash` | `string` | `ethers.ZeroHash` |
| `initialGuardianSafePeriod` | `number` | `SocialRecovery.defalutInitialGuardianSafePeriod` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:247](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L247)

___

### packRawHash

▸ **packRawHash**(`hash`, `validAfter?`, `validUntil?`): `Promise`\<[`Result`](../modules.md#result)\<\{ `packedHash`: `string` ; `validationData`: `string`  }, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |
| `validAfter?` | `number` |
| `validUntil?` | `number` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<\{ `packedHash`: `string` ; `validationData`: `string`  }, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:427](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L427)

___

### packUserOpEOASignature

▸ **packUserOpEOASignature**(`validatorAddress`, `signature`, `validationData`, `guardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack userOp signature (EOA)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `validatorAddress` | `string` | validator contract address |
| `signature` | `string` | EOA signature |
| `validationData` | `string` | validation data |
| `guardHookInputData?` | `GuardHookInputData` |  |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

**`Memberof`**

ElytroWallet

#### Defined in

[packages/sdk/src/elytroWallet.ts:486](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L486)

___

### packUserOpHash

▸ **packUserOpHash**(`userOp`, `validAfter?`, `validUntil?`): `Promise`\<[`Result`](../modules.md#result)\<\{ `packedUserOpHash`: `string` ; `validationData`: `string`  }, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |
| `validAfter?` | `number` |
| `validUntil?` | `number` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<\{ `packedUserOpHash`: `string` ; `validationData`: `string`  }, `Error`\>\>

#### Implementation of

IElytroWallet.packUserOpHash

#### Defined in

[packages/sdk/src/elytroWallet.ts:415](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L415)

___

### packUserOpP256Signature

▸ **packUserOpP256Signature**(`validatorAddress`, `signatureData`, `validationData`, `guardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack userOp signature (P256)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `validatorAddress` | `string` | validator contract address |
| `signatureData` | `Object` | signature data, messageHash is userOp hash(packed userOp hash) |
| `signatureData.authenticatorData` | `string` | - |
| `signatureData.clientDataSuffix` | `string` | - |
| `signatureData.messageHash` | `string` | - |
| `signatureData.publicKey` | `string` \| [`ECCPoint`](../interfaces/ECCPoint.md) | - |
| `signatureData.r` | `string` | - |
| `signatureData.s` | `string` | - |
| `validationData` | `string` | validation data |
| `guardHookInputData?` | `GuardHookInputData` |  |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

**`Memberof`**

ElytroWallet

#### Defined in

[packages/sdk/src/elytroWallet.ts:515](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L515)

___

### packUserOpRS256Signature

▸ **packUserOpRS256Signature**(`validatorAddress`, `signatureData`, `validationData`, `guardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

pack userOp signature (RS256)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `validatorAddress` | `string` | validator contract address |
| `signatureData` | `Object` |  |
| `signatureData.authenticatorData` | `string` | - |
| `signatureData.clientDataSuffix` | `string` | - |
| `signatureData.messageHash` | `string` | - |
| `signatureData.publicKey` | [`RSAPublicKey`](../interfaces/RSAPublicKey.md) | - |
| `signatureData.signature` | `string` | - |
| `validationData` | `string` |  |
| `guardHookInputData?` | `GuardHookInputData` |  |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

{Promise<Result<string, Error>>}

**`Memberof`**

ElytroWallet

#### Defined in

[packages/sdk/src/elytroWallet.ts:551](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L551)

___

### preFund

▸ **preFund**(`userOp`): `Promise`\<[`Result`](../modules.md#result)\<\{ `deposit`: `string` ; `missfund`: `string` ; `prefund`: `string`  }, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<\{ `deposit`: `string` ; `missfund`: `string` ; `prefund`: `string`  }, `Error`\>\>

#### Implementation of

IElytroWallet.preFund

#### Defined in

[packages/sdk/src/elytroWallet.ts:296](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L296)

___

### prePackUserOpSignature

▸ **prePackUserOpSignature**(`guardHookInputData?`): `Promise`\<[`Result`](../modules.md#result)\<`undefined` \| `HookInputData`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `guardHookInputData?` | `GuardHookInputData` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`undefined` \| `HookInputData`, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:458](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L458)

___

### sendUserOperation

▸ **sendUserOperation**(`userOp`): `Promise`\<[`Result`](../modules.md#result)\<``true``, [`UserOpErrors`](UserOpErrors.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<``true``, [`UserOpErrors`](UserOpErrors.md)\>\>

#### Implementation of

IElytroWallet.sendUserOperation

#### Defined in

[packages/sdk/src/elytroWallet.ts:679](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L679)

___

### userOpHash

▸ **userOpHash**(`userOp`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | [`UserOperation`](../modules.md#useroperation) |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Implementation of

IElytroWallet.userOpHash

#### Defined in

[packages/sdk/src/elytroWallet.ts:406](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L406)

___

### walletDeployed

▸ **walletDeployed**(`walletAddress`): `Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `walletAddress` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:730](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L730)

___

### initializeData

▸ **initializeData**(`socialRecoveryModuleAddress`, `defalutCallbackHandlerAddress`, `initialKeys`, `initialGuardianHash?`, `initialGuardianSafePeriod?`): [`Result`](../modules.md#result)\<`string`, `Error`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `socialRecoveryModuleAddress` | `undefined` \| `string` | `undefined` |
| `defalutCallbackHandlerAddress` | `undefined` \| `string` | `undefined` |
| `initialKeys` | [`InitialKey`](../modules.md#initialkey)[] | `undefined` |
| `initialGuardianHash` | `string` | `ethers.ZeroHash` |
| `initialGuardianSafePeriod` | `number` | `SocialRecovery.defalutInitialGuardianSafePeriod` |

#### Returns

[`Result`](../modules.md#result)\<`string`, `Error`\>

#### Defined in

[packages/sdk/src/elytroWallet.ts:205](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/sdk/src/elytroWallet.ts#L205)
