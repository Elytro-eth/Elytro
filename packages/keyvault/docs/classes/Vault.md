[@elytro/keyvault](../README.md) / [Modules](../modules.md) / Vault

# Class: Vault

Vault

**`Export`**

Vault

**`Implements`**

## Implements

- `IVault`

## Table of contents

### Constructors

- [constructor](Vault.md#constructor)

### Properties

- [\_AES\_256\_GCM](Vault.md#_aes_256_gcm)
- [\_EventEmitter](Vault.md#_eventemitter)
- [\_KeyVaultDataCache](Vault.md#_keyvaultdatacache)
- [\_accounts](Vault.md#_accounts)
- [\_lockTime](Vault.md#_locktime)
- [\_storage](Vault.md#_storage)
- [\_timeout](Vault.md#_timeout)
- [\_timeoutDuration](Vault.md#_timeoutduration)
- [DEFAULT\_PATH](Vault.md#default_path)

### Methods

- [\_clearTimeout](Vault.md#_cleartimeout)
- [\_deriveKey](Vault.md#_derivekey)
- [\_init](Vault.md#_init)
- [\_isInitialized](Vault.md#_isinitialized)
- [\_loadData](Vault.md#_loaddata)
- [\_loadSigner](Vault.md#_loadsigner)
- [\_rawSign](Vault.md#_rawsign)
- [\_saveData](Vault.md#_savedata)
- [\_touchTimeout](Vault.md#_touchtimeout)
- [changePassword](Vault.md#changepassword)
- [destroy](Vault.md#destroy)
- [emit](Vault.md#emit)
- [getSigner](Vault.md#getsigner)
- [init](Vault.md#init)
- [initBip39](Vault.md#initbip39)
- [isInitialized](Vault.md#isinitialized)
- [isLocked](Vault.md#islocked)
- [lock](Vault.md#lock)
- [off](Vault.md#off)
- [on](Vault.md#on)
- [personalSign](Vault.md#personalsign)
- [rawSign](Vault.md#rawsign)
- [restore](Vault.md#restore)
- [unlock](Vault.md#unlock)
- [\_hash](Vault.md#_hash)
- [remove](Vault.md#remove)
- [rename](Vault.md#rename)

## Constructors

### constructor

• **new Vault**(`tag`): [`Vault`](Vault.md)

Creates an instance of Vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tag` | `string` | tag for keyVault |

#### Returns

[`Vault`](Vault.md)

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:61](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L61)

## Properties

### \_AES\_256\_GCM

• `Private` **\_AES\_256\_GCM**: `undefined` \| `AES_256_GCM`

#### Defined in

[keyvault/src/vault.ts:42](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L42)

___

### \_EventEmitter

• `Private` **\_EventEmitter**: `Emitter`\<[`VaultEvents`](../modules.md#vaultevents)\>

#### Defined in

[keyvault/src/vault.ts:48](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L48)

___

### \_KeyVaultDataCache

• `Private` **\_KeyVaultDataCache**: `undefined` \| `KeyVaultStorageStructure` = `undefined`

#### Defined in

[keyvault/src/vault.ts:44](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L44)

___

### \_accounts

• `Private` **\_accounts**: `Map`\<`string`, `ECDSA`\>

#### Defined in

[keyvault/src/vault.ts:46](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L46)

___

### \_lockTime

• `Private` **\_lockTime**: `number` = `0`

#### Defined in

[keyvault/src/vault.ts:52](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L52)

___

### \_storage

• `Private` **\_storage**: `Storage`

#### Defined in

[keyvault/src/vault.ts:41](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L41)

___

### \_timeout

• `Private` **\_timeout**: `undefined` \| `Timeout`

#### Defined in

[keyvault/src/vault.ts:50](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L50)

___

### \_timeoutDuration

• `Private` `Readonly` **\_timeoutDuration**: `number`

#### Defined in

[keyvault/src/vault.ts:51](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L51)

___

### DEFAULT\_PATH

▪ `Static` `Readonly` **DEFAULT\_PATH**: ``"m/44'/60'/0'/0/0"``

#### Defined in

[keyvault/src/vault.ts:54](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L54)

## Methods

### \_clearTimeout

▸ **_clearTimeout**(): `void`

#### Returns

`void`

#### Defined in

[keyvault/src/vault.ts:184](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L184)

___

### \_deriveKey

▸ **_deriveKey**(`password`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `password` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Defined in

[keyvault/src/vault.ts:223](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L223)

___

### \_init

▸ **_init**(`seed`, `password`, `enforce?`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `seed` | `string` |
| `password` | `string` |
| `enforce?` | `boolean` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

#### Defined in

[keyvault/src/vault.ts:278](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L278)

___

### \_isInitialized

▸ **_isInitialized**(): `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[keyvault/src/vault.ts:376](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L376)

___

### \_loadData

▸ **_loadData**(): `Promise`\<[`Result`](../modules.md#result)\<`KeyVaultStorageStructure`, `Error`\>\>

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`KeyVaultStorageStructure`, `Error`\>\>

#### Defined in

[keyvault/src/vault.ts:191](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L191)

___

### \_loadSigner

▸ **_loadSigner**(`path`): `Promise`\<[`Result`](../modules.md#result)\<`ECDSA`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `undefined` \| `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`ECDSA`, `Error`\>\>

#### Defined in

[keyvault/src/vault.ts:490](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L490)

___

### \_rawSign

▸ **_rawSign**(`byte32Message`, `path`): `Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

sign a message (rawSign)

#### Parameters

| Name | Type |
| :------ | :------ |
| `byte32Message` | `string` \| `Uint8Array` |
| `path` | `undefined` \| `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

{Promise<Result<SignData, Error>>}

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:568](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L568)

___

### \_saveData

▸ **_saveData**(`keyVaultStorageStructure`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `keyVaultStorageStructure` | `KeyVaultStorageStructure` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

#### Defined in

[keyvault/src/vault.ts:214](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L214)

___

### \_touchTimeout

▸ **_touchTimeout**(`createTimer`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `createTimer` | `boolean` |

#### Returns

`void`

#### Defined in

[keyvault/src/vault.ts:173](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L173)

___

### changePassword

▸ **changePassword**(`oldPassword`, `newPassword`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

not implemented

#### Parameters

| Name | Type |
| :------ | :------ |
| `oldPassword` | `string` |
| `newPassword` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.changePassword

#### Defined in

[keyvault/src/vault.ts:472](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L472)

___

### destroy

▸ **destroy**(): `Promise`\<`void`\>

for security reason, allways call this method after use

#### Returns

`Promise`\<`void`\>

{Promise<void>}

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:361](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L361)

___

### emit

▸ **emit**\<`Key`\>(`eventName`, `payload`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Key` | extends keyof [`VaultEvents`](../modules.md#vaultevents) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `Key` |
| `payload` | [`VaultEvents`](../modules.md#vaultevents)[`Key`] |

#### Returns

`void`

#### Defined in

[keyvault/src/vault.ts:160](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L160)

___

### getSigner

▸ **getSigner**(`path`): `Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `undefined` \| `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`string`, `Error`\>\>

#### Implementation of

IVault.getSigner

#### Defined in

[keyvault/src/vault.ts:480](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L480)

___

### init

▸ **init**(`password`, `enforce?`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

initialize vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `password` | `string` |  |
| `enforce?` | `boolean` | if true, delete all data and re-initialize |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.init

#### Defined in

[keyvault/src/vault.ts:272](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L272)

___

### initBip39

▸ **initBip39**(`phrase`, `password`, `enforce?`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

initialize vault with bip39 phrase

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `phrase` | `string` | 12 words bip39 phrase,split by space |
| `password` | `string` |  |
| `enforce?` | `boolean` | if true, delete all data and re-initialize |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.initBip39

#### Defined in

[keyvault/src/vault.ts:246](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L246)

___

### isInitialized

▸ **isInitialized**(): `Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

check if vault is initialized

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

{Promise<Result<boolean, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.isInitialized

#### Defined in

[keyvault/src/vault.ts:344](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L344)

___

### isLocked

▸ **isLocked**(): `Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

check if vault is locked

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`boolean`, `Error`\>\>

{Promise<Result<boolean, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.isLocked

#### Defined in

[keyvault/src/vault.ts:458](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L458)

___

### lock

▸ **lock**(): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

lock keyVault

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.lock

#### Defined in

[keyvault/src/vault.ts:435](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L435)

___

### off

▸ **off**\<`Key`\>(`eventName`, `handler?`): `void`

remove event listener

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `Key` | extends keyof [`VaultEvents`](../modules.md#vaultevents) | extends keyof VaultEvents |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `Key` | event name |
| `handler?` | (`arg`: [`VaultEvents`](../modules.md#vaultevents)[`Key`]) => `unknown` | event handler |

#### Returns

`void`

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:152](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L152)

___

### on

▸ **on**\<`Key`\>(`eventName`, `handler`): `void`

add event listener

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `Key` | extends keyof [`VaultEvents`](../modules.md#vaultevents) | extends keyof VaultEvents |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `Key` | event name |
| `handler` | (`arg`: [`VaultEvents`](../modules.md#vaultevents)[`Key`]) => `unknown` | event handler |

#### Returns

`void`

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:136](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L136)

___

### personalSign

▸ **personalSign**(`byte32Message`, `path`): `Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

sign a message (personalSign)

#### Parameters

| Name | Type |
| :------ | :------ |
| `byte32Message` | `string` \| `Uint8Array` |
| `path` | `undefined` \| `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

{Promise<Result<SignData, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.personalSign

#### Defined in

[keyvault/src/vault.ts:538](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L538)

___

### rawSign

▸ **rawSign**(`byte32Message`, `path`): `Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `byte32Message` | `string` \| `Uint8Array` |
| `path` | `undefined` \| `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<[`SignData`](../interfaces/SignData.md), `Error`\>\>

{Promise<Result<SignData, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.rawSign

#### Defined in

[keyvault/src/vault.ts:597](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L597)

___

### restore

▸ **restore**(`exportData`, `password`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

not implemented

#### Parameters

| Name | Type |
| :------ | :------ |
| `exportData` | `string` |
| `password` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.restore

#### Defined in

[keyvault/src/vault.ts:332](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L332)

___

### unlock

▸ **unlock**(`password`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

unlock keyVault

#### Parameters

| Name | Type |
| :------ | :------ |
| `password` | `string` |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Memberof`**

Vault

#### Implementation of

IVault.unlock

#### Defined in

[keyvault/src/vault.ts:391](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L391)

___

### \_hash

▸ **_hash**(`data`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `string` |

#### Returns

`string`

#### Defined in

[keyvault/src/vault.ts:232](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L232)

___

### remove

▸ **remove**(`tag`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

destroy vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tag` | `string` | tag for keyVault |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Static`**

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:85](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L85)

___

### rename

▸ **rename**(`oldTag`, `newTag`): `Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

rename vault, must lock first

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `oldTag` | `string` | old tag |
| `newTag` | `string` | new tag |

#### Returns

`Promise`\<[`Result`](../modules.md#result)\<`void`, `Error`\>\>

{Promise<Result<void, Error>>}

**`Static`**

**`Memberof`**

Vault

#### Defined in

[keyvault/src/vault.ts:99](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/keyvault/src/vault.ts#L99)
