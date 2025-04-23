[@elytro/zkemail-proof](../README.md) / [Modules](../modules.md) / EmailProof

# Class: EmailProof

## Table of contents

### Constructors

- [constructor](EmailProof.md#constructor)

### Properties

- [\_GenerateWitness](EmailProof.md#_generatewitness)
- [\_file\_wasm](EmailProof.md#_file_wasm)
- [\_file\_zkey](EmailProof.md#_file_zkey)
- [\_randomSeed](EmailProof.md#_randomseed)
- [\_rapidsnarkProverBin](EmailProof.md#_rapidsnarkproverbin)
- [\_tmpDir](EmailProof.md#_tmpdir)
- [vKey](EmailProof.md#vkey)

### Methods

- [\_fullProve](EmailProof.md#_fullprove)
- [\_randomString](EmailProof.md#_randomstring)
- [proveFromCircuitinput](EmailProof.md#provefromcircuitinput)
- [proveFromEml](EmailProof.md#provefromeml)

## Constructors

### constructor

• **new EmailProof**(`file_wasm`, `file_zkey`, `file_vkey`, `rapidsnarkProverBin?`, `tmpDir?`): [`EmailProof`](EmailProof.md)

Creates an instance of EmailProof.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `file_wasm` | `string` | the path to the file EmailApprover.wasm |
| `file_zkey` | `string` | the path to the file emailapprover_final.zkey |
| `file_vkey` | `string` | the path to the file verification_key.json |
| `rapidsnarkProverBin?` | `string` | the path to the file `rapidsnark-xxx-v0.0.2/bin/prover`, if set, will use rapidsnark to generate proof. download from `https://github.com/iden3/rapidsnark/releases/` |
| `tmpDir?` | `string` | - |

#### Returns

[`EmailProof`](EmailProof.md)

**`Memberof`**

EmailProof

#### Defined in

[emailProof.ts:45](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L45)

## Properties

### \_GenerateWitness

• `Private` **\_GenerateWitness**: `GenerateWitness`

#### Defined in

[emailProof.ts:35](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L35)

___

### \_file\_wasm

• `Private` **\_file\_wasm**: `string`

#### Defined in

[emailProof.ts:30](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L30)

___

### \_file\_zkey

• `Private` **\_file\_zkey**: `string`

#### Defined in

[emailProof.ts:31](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L31)

___

### \_randomSeed

• `Private` **\_randomSeed**: `number` = `0`

#### Defined in

[emailProof.ts:185](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L185)

___

### \_rapidsnarkProverBin

• `Private` **\_rapidsnarkProverBin**: `undefined` \| `string`

#### Defined in

[emailProof.ts:33](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L33)

___

### \_tmpDir

• `Private` **\_tmpDir**: `string`

#### Defined in

[emailProof.ts:34](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L34)

___

### vKey

• `Private` **vKey**: `any`

#### Defined in

[emailProof.ts:32](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L32)

## Methods

### \_fullProve

▸ **_fullProve**(`circuitinput`, `wasmFile`, `zkeyFile`): `Promise`\<``null`` \| \{ `proof`: `Groth16Proof` ; `publicSignals`: `PublicSignals`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `circuitinput` | [`IEmailApproverCircuitInputs`](../modules.md#iemailapprovercircuitinputs) |
| `wasmFile` | `string` |
| `zkeyFile` | `string` |

#### Returns

`Promise`\<``null`` \| \{ `proof`: `Groth16Proof` ; `publicSignals`: `PublicSignals`  }\>

#### Defined in

[emailProof.ts:190](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L190)

___

### \_randomString

▸ **_randomString**(): `string`

#### Returns

`string`

#### Defined in

[emailProof.ts:186](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L186)

___

### proveFromCircuitinput

▸ **proveFromCircuitinput**(`circuitinput`): `Promise`\<``null`` \| [`IEmailProof`](../interfaces/IEmailProof.md)\>

generate proof from circuit input

#### Parameters

| Name | Type |
| :------ | :------ |
| `circuitinput` | [`IEmailApproverCircuitInputs`](../modules.md#iemailapprovercircuitinputs) |

#### Returns

`Promise`\<``null`` \| [`IEmailProof`](../interfaces/IEmailProof.md)\>

{(Promise<IEmailProof | null>)}

**`Memberof`**

EmailProof

#### Defined in

[emailProof.ts:139](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L139)

___

### proveFromEml

▸ **proveFromEml**(`emlFilePathOrEmlContent`, `senderCommitmentRand`): `Promise`\<``null`` \| [`IEmailProof`](../interfaces/IEmailProof.md)\>

generate proof from eml file path or eml content

#### Parameters

| Name | Type |
| :------ | :------ |
| `emlFilePathOrEmlContent` | `string` |
| `senderCommitmentRand` | `bigint` |

#### Returns

`Promise`\<``null`` \| [`IEmailProof`](../interfaces/IEmailProof.md)\>

{(Promise<IEmailProof | null>)}

**`Memberof`**

EmailProof

#### Defined in

[emailProof.ts:96](https://github.com/jayden-sudo/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailProof.ts#L96)
