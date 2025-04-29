[@elytro/zkemail-proof](../README.md) / [Modules](../modules.md) / EmailApproverFactory

# Class: EmailApproverFactory

## Table of contents

### Constructors

- [constructor](EmailApproverFactory.md#constructor)

### Properties

- [\_EmailApproverAddress](EmailApproverFactory.md#_emailapproveraddress)
- [\_EmailApproverFactoryAddress](EmailApproverFactory.md#_emailapproverfactoryaddress)

### Methods

- [calcSalt](EmailApproverFactory.md#calcsalt)
- [createEmailApprover](EmailApproverFactory.md#createemailapprover)
- [createEmailApprover2](EmailApproverFactory.md#createemailapprover2)
- [getCreate2Address](EmailApproverFactory.md#getcreate2address)
- [proxyCode](EmailApproverFactory.md#proxycode)
- [emailAddrCommit](EmailApproverFactory.md#emailaddrcommit)

## Constructors

### constructor

• **new EmailApproverFactory**(`EmailApproverFactoryAddress`, `EmailApproverAddress`): [`EmailApproverFactory`](EmailApproverFactory.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `EmailApproverFactoryAddress` | `string` |
| `EmailApproverAddress` | `string` |

#### Returns

[`EmailApproverFactory`](EmailApproverFactory.md)

#### Defined in

[emailApproverFactory.ts:48](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L48)

## Properties

### \_EmailApproverAddress

• `Private` **\_EmailApproverAddress**: `string`

#### Defined in

[emailApproverFactory.ts:46](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L46)

___

### \_EmailApproverFactoryAddress

• `Private` **\_EmailApproverFactoryAddress**: `string`

#### Defined in

[emailApproverFactory.ts:45](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L45)

## Methods

### calcSalt

▸ **calcSalt**(`initializer`, `salt`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `initializer` | `string` |
| `salt` | `string` |

#### Returns

`string`

#### Defined in

[emailApproverFactory.ts:121](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L121)

___

### createEmailApprover

▸ **createEmailApprover**(`emailAddr`, `email_commitment_rand?`, `salt?`): `Promise`\<[`ICreateEmailApproverArgs`](../interfaces/ICreateEmailApproverArgs.md)\>

EmailApproverFactory.createEmailApprover()

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emailAddr` | `string` | email address( Case sensitive) |
| `email_commitment_rand?` | `bigint` | random number |
| `salt?` | `bigint` | create2 salt |

#### Returns

`Promise`\<[`ICreateEmailApproverArgs`](../interfaces/ICreateEmailApproverArgs.md)\>

{ICreateEmailApproverArgs}

**`Memberof`**

EmailApproverFactory

#### Defined in

[emailApproverFactory.ts:164](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L164)

___

### createEmailApprover2

▸ **createEmailApprover2**(`emailAddrCommit`, `salt?`): [`ICreateEmailApproverArgs`](../interfaces/ICreateEmailApproverArgs.md)

EmailApproverFactory.createEmailApprover()

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emailAddrCommit` | `bigint` | poseidon hash of (email address \| commitment_rand) |
| `salt?` | `bigint` | create2 salt |

#### Returns

[`ICreateEmailApproverArgs`](../interfaces/ICreateEmailApproverArgs.md)

{ICreateEmailApproverArgs}

**`Memberof`**

EmailApproverFactory

#### Defined in

[emailApproverFactory.ts:141](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L141)

___

### getCreate2Address

▸ **getCreate2Address**(`initializer`, `salt`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `initializer` | `string` |
| `salt` | `string` |

#### Returns

`string`

#### Defined in

[emailApproverFactory.ts:171](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L171)

___

### proxyCode

▸ **proxyCode**(): `string`

#### Returns

`string`

#### Defined in

[emailApproverFactory.ts:62](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L62)

___

### emailAddrCommit

▸ **emailAddrCommit**(`emailAddr`, `email_commitment_rand`): `Promise`\<`bigint`\>

generate email address commitment

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emailAddr` | `string` | email address ( Case sensitive ) |
| `email_commitment_rand` | `bigint` | - |

#### Returns

`Promise`\<`bigint`\>

{bigint}

**`Static`**

**`Memberof`**

EmailProof

#### Defined in

[emailApproverFactory.ts:79](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L79)
