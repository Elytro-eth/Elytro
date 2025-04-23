[@elytro/zkemail-proof](../README.md) / [Modules](../modules.md) / ICreateEmailApproverArgs

# Interface: ICreateEmailApproverArgs

**`Export`**

ICreateEmailApproverArgs

## Table of contents

### Properties

- [delpoyedAddress](ICreateEmailApproverArgs.md#delpoyedaddress)
- [salt](ICreateEmailApproverArgs.md#salt)
- [senderCommitment](ICreateEmailApproverArgs.md#sendercommitment)

## Properties

### delpoyedAddress

• **delpoyedAddress**: `string`

deployed address

**`Memberof`**

ICreateEmailApproverArgs

#### Defined in

[emailApproverFactory.ts:40](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L40)

___

### salt

• **salt**: `string`

bytes32 - create2 salt

**`Memberof`**

ICreateEmailApproverArgs

#### Defined in

[emailApproverFactory.ts:32](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L32)

___

### senderCommitment

• **senderCommitment**: `string`

bytes32 - poseidon hash of (email address | commitment_rand)

**`Memberof`**

ICreateEmailApproverArgs

#### Defined in

[emailApproverFactory.ts:24](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/zkemailproof/src/emailApproverFactory.ts#L24)
