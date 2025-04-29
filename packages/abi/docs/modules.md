[@elytro/abi](README.md) / Modules

# @elytro/abi

## Table of contents

### Variables

- [ABI\_AaveUsdcSaveAutomation](modules.md#abi_aaveusdcsaveautomation)
- [ABI\_BaseModule](modules.md#abi_basemodule)
- [ABI\_BaseSocialRecovery](modules.md#abi_basesocialrecovery)
- [ABI\_ClaimInterest](modules.md#abi_claiminterest)
- [ABI\_Crypto2FAHook](modules.md#abi_crypto2fahook)
- [ABI\_DefaultCallbackHandler](modules.md#abi_defaultcallbackhandler)
- [ABI\_EIP1271Wallet](modules.md#abi_eip1271wallet)
- [ABI\_ERC1271Handler](modules.md#abi_erc1271handler)
- [ABI\_ERC20Paymaster](modules.md#abi_erc20paymaster)
- [ABI\_Elytro](modules.md#abi_elytro)
- [ABI\_ElytroDefaultValidator](modules.md#abi_elytrodefaultvalidator)
- [ABI\_ElytroFactory](modules.md#abi_elytrofactory)
- [ABI\_ElytroHookManager](modules.md#abi_elytrohookmanager)
- [ABI\_ElytroInstence](modules.md#abi_elytroinstence)
- [ABI\_ElytroLogicInstence](modules.md#abi_elytrologicinstence)
- [ABI\_ElytroModuleManager](modules.md#abi_elytromodulemanager)
- [ABI\_ElytroOwnerManager](modules.md#abi_elytroownermanager)
- [ABI\_ElytroUpgradeManager](modules.md#abi_elytroupgrademanager)
- [ABI\_ElytroValidatorManager](modules.md#abi_elytrovalidatormanager)
- [ABI\_EmailApprover](modules.md#abi_emailapprover)
- [ABI\_EmailApproverFactory](modules.md#abi_emailapproverfactory)
- [ABI\_EntryPoint](modules.md#abi_entrypoint)
- [ABI\_Errors](modules.md#abi_errors)
- [ABI\_HelloWorld](modules.md#abi_helloworld)
- [ABI\_NewImplementation](modules.md#abi_newimplementation)
- [ABI\_ReceivePayment](modules.md#abi_receivepayment)
- [ABI\_SocialRecoveryModule](modules.md#abi_socialrecoverymodule)
- [ABI\_TestOracle](modules.md#abi_testoracle)
- [ABI\_TokenERC20](modules.md#abi_tokenerc20)
- [ABI\_UpgradeModule](modules.md#abi_upgrademodule)

## Variables

### ABI\_AaveUsdcSaveAutomation

• **ABI\_AaveUsdcSaveAutomation**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_owner"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `name`: `string` = "bots"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "address"; `name`: `string` = "bot"; `type`: `string` = "address" }[] ; `name`: `string` = "BotAdded"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_AaveUsdcSaveAutomation.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_AaveUsdcSaveAutomation.ts#L3)

___

### ABI\_BaseModule

• **ABI\_BaseModule**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes4"; `name`: `string` = "interfaceId"; `type`: `string` = "bytes4" }[] ; `name`: `string` = "supportsInterface"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "wallet"; `type`: `string` = "address" }[] ; `name`: `string` = "ModuleDeInit"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" })[]

#### Defined in

[ABI/ABI_BaseModule.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_BaseModule.ts#L3)

___

### ABI\_BaseSocialRecovery

• **ABI\_BaseSocialRecovery**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = ""; `type`: `string` = "bytes32" }[] ; `name`: `string` = "approvedHashes"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = ""; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "guardian"; `type`: `string` = "address" }[] ; `name`: `string` = "ApproveHash"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "length"; `type`: `string` = "uint256" }[] ; `name`: `string` = "ECDSAInvalidSignatureLength"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_BaseSocialRecovery.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_BaseSocialRecovery.ts#L3)

___

### ABI\_ClaimInterest

• **ABI\_ClaimInterest**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_owner"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `name`: `string` = "nonces"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = ""; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "addr"; `type`: `string` = "address" }[] ; `name`: `string` = "Deposited"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "length"; `type`: `string` = "uint256" }[] ; `name`: `string` = "ECDSAInvalidSignatureLength"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_ClaimInterest.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_ClaimInterest.ts#L3)

___

### ABI\_Crypto2FAHook

• **ABI\_Crypto2FAHook**: (\{ `inputs`: (\{ `components`: \{ `internalType`: `string` = "address"; `name`: `string` = "sender"; `type`: `string` = "address" }[] ; `internalType`: `string` = "struct PackedUserOperation"; `name`: `string` = "userOp"; `type`: `string` = "tuple" } \| \{ `components?`: `undefined` ; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" })[] ; `name`: `string` = "preUserOpValidationHook"; `outputs`: `never`[] = []; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `inputs`: \{ `internalType`: `string` = "bytes4"; `name`: `string` = "interfaceId"; `type`: `string` = "bytes4" }[] ; `name`: `string` = "supportsInterface"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" } \| \{ `inputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "length"; `type`: `string` = "uint256" }[] ; `name`: `string` = "ECDSAInvalidSignatureLength"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_Crypto2FAHook.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_Crypto2FAHook.ts#L3)

___

### ABI\_DefaultCallbackHandler

• **ABI\_DefaultCallbackHandler**: (\{ `inputs?`: `undefined` ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "payable"; `type`: `string` = "fallback" } \| \{ `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `name`: `string` = "onERC1155BatchReceived"; `outputs`: \{ `internalType`: `string` = "bytes4"; `name`: `string` = ""; `type`: `string` = "bytes4" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" })[]

#### Defined in

[ABI/ABI_DefaultCallbackHandler.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_DefaultCallbackHandler.ts#L3)

___

### ABI\_EIP1271Wallet

• **ABI\_EIP1271Wallet**: \{ `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = "hash"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "isValidSignature"; `outputs`: \{ `internalType`: `string` = "bytes4"; `name`: `string` = "magicValue"; `type`: `string` = "bytes4" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" }[]

#### Defined in

[ABI/ABI_EIP1271Wallet.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_EIP1271Wallet.ts#L3)

___

### ABI\_ERC1271Handler

• **ABI\_ERC1271Handler**: (\{ `inputs`: `never`[] = []; `name`: `string` = "getChainId"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = ""; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `inputs`: `never`[] = []; `name`: `string` = "CALLER\_MUST\_BE\_MODULE"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_ERC1271Handler.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_ERC1271Handler.ts#L3)

___

### ABI\_ERC20Paymaster

• **ABI\_ERC20Paymaster**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "contract IEntryPoint"; `name`: `string` = "\_entryPoint"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: (\{ `components`: \{ `internalType`: `string` = "address"; `name`: `string` = "sender"; `type`: `string` = "address" }[] ; `internalType`: `string` = "struct PackedUserOperation"; `name`: `string` = "userOp"; `type`: `string` = "tuple" } \| \{ `components?`: `undefined` ; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" })[] ; `name`: `string` = "validatePaymasterUserOp"; `outputs`: \{ `internalType`: `string` = "bytes"; `name`: `string` = "context"; `type`: `string` = "bytes" }[] ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "address"; `name`: `string` = "token"; `type`: `string` = "address" }[] ; `name`: `string` = "ConfigUpdated"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_ERC20Paymaster.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_ERC20Paymaster.ts#L3)

___

### ABI\_Elytro

• **ABI\_Elytro**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_entryPoint"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs?`: `undefined` ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "payable"; `type`: `string` = "fallback" } \| \{ `anonymous?`: `undefined` = false; `inputs`: (\{ `components`: \{ `internalType`: `string` = "address"; `name`: `string` = "sender"; `type`: `string` = "address" }[] ; `internalType`: `string` = "struct PackedUserOperation"; `name`: `string` = "userOp"; `type`: `string` = "tuple" } \| \{ `components?`: `undefined` ; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" })[] ; `name`: `string` = "validateUserOp"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "validationData"; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "payable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "fallbackContract"; `type`: `string` = "address" }[] ; `name`: `string` = "FallbackChanged"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "ADDRESS\_ALREADY\_EXISTS"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_Elytro.ts:3

___

### ABI\_ElytroDefaultValidator

• **ABI\_ElytroDefaultValidator**: (\{ `inputs`: (\{ `components`: \{ `internalType`: `string` = "address"; `name`: `string` = "sender"; `type`: `string` = "address" }[] ; `internalType`: `string` = "struct PackedUserOperation"; `name`: `string` = ""; `type`: `string` = "tuple" } \| \{ `components?`: `undefined` ; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" })[] ; `name`: `string` = "validateUserOp"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "validationData"; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `inputs`: `never`[] = []; `name`: `string` = "INVALID\_SIGNTYPE"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroDefaultValidator.ts:3

___

### ABI\_ElytroFactory

• **ABI\_ElytroFactory**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_walletImpl"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes"; `name`: `string` = "\_initializer"; `type`: `string` = "bytes" }[] ; `name`: `string` = "createWallet"; `outputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "proxy"; `type`: `string` = "address" }[] ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "proxy"; `type`: `string` = "address" }[] ; `name`: `string` = "ElytroCreation"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroFactory.ts:3

___

### ABI\_ElytroHookManager

• **ABI\_ElytroHookManager**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "hook"; `type`: `string` = "address" }[] ; `name`: `string` = "isInstalledHook"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "address"; `name`: `string` = "hook"; `type`: `string` = "address" }[] ; `name`: `string` = "HookInstalled"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "ADDRESS\_ALREADY\_EXISTS"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroHookManager.ts:3

___

### ABI\_ElytroInstence

• **ABI\_ElytroInstence**: (\{ `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "defaultCallbackHandler"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `inputs`: `never`[] = []; `name`: `string` = "elytro"; `outputs`: \{ `internalType`: `string` = "contract IElytro"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" })[]

#### Defined in

ABI/ABI_ElytroInstence.ts:3

___

### ABI\_ElytroLogicInstence

• **ABI\_ElytroLogicInstence**: (\{ `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_entryPoint"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `inputs`: `never`[] = []; `name`: `string` = "elytroLogic"; `outputs`: \{ `internalType`: `string` = "contract Elytro"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" })[]

#### Defined in

ABI/ABI_ElytroLogicInstence.ts:3

___

### ABI\_ElytroModuleManager

• **ABI\_ElytroModuleManager**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "module"; `type`: `string` = "address" }[] ; `name`: `string` = "isInstalledModule"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "address"; `name`: `string` = "module"; `type`: `string` = "address" }[] ; `name`: `string` = "ModuleInstalled"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "ADDRESS\_ALREADY\_EXISTS"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroModuleManager.ts:3

___

### ABI\_ElytroOwnerManager

• **ABI\_ElytroOwnerManager**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = "owner"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "isOwner"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "bytes32"; `name`: `string` = "owner"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "OwnerAdded"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "CALLER\_MUST\_BE\_MODULE"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroOwnerManager.ts:3

___

### ABI\_ElytroUpgradeManager

• **ABI\_ElytroUpgradeManager**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "oldImplementation"; `type`: `string` = "address" }[] ; `name`: `string` = "upgradeFrom"; `outputs`: `never`[] = []; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "oldImplementation"; `type`: `string` = "address" }[] ; `name`: `string` = "Upgraded"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" })[]

#### Defined in

ABI/ABI_ElytroUpgradeManager.ts:3

___

### ABI\_ElytroValidatorManager

• **ABI\_ElytroValidatorManager**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes"; `name`: `string` = "validatorAndData"; `type`: `string` = "bytes" }[] ; `name`: `string` = "installValidator"; `outputs`: `never`[] = []; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "listValidator"; `outputs`: \{ `internalType`: `string` = "address[]"; `name`: `string` = "validators"; `type`: `string` = "address[]" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "address"; `name`: `string` = "validator"; `type`: `string` = "address" }[] ; `name`: `string` = "ValidatorInstalled"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "ADDRESS\_ALREADY\_EXISTS"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

ABI/ABI_ElytroValidatorManager.ts:3

___

### ABI\_EmailApprover

• **ABI\_EmailApprover**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "contract DKIMRegistry"; `name`: `string` = "registry"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = ""; `type`: `string` = "bytes32" }[] ; `name`: `string` = "approved"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "bytes32"; `name`: `string` = "hash"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "Approved"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "target"; `type`: `string` = "address" }[] ; `name`: `string` = "AddressEmptyCode"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_EmailApprover.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_EmailApprover.ts#L3)

___

### ABI\_EmailApproverFactory

• **ABI\_EmailApproverFactory**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_approverImpl"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = "\_senderCommitment"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "createEmailApprover"; `outputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "proxy"; `type`: `string` = "address" }[] ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "proxy"; `type`: `string` = "address" }[] ; `name`: `string` = "EmailApproverCreation"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" })[]

#### Defined in

[ABI/ABI_EmailApproverFactory.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_EmailApproverFactory.ts#L3)

___

### ABI\_EntryPoint

• **ABI\_EntryPoint**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = "success"; `type`: `string` = "bool" }[] ; `name`: `string` = "DelegateAndRevert"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "AccountDeployed"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "account"; `type`: `string` = "address" }[] ; `name`: `string` = "getDepositInfo"; `outputs`: \{ `components`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "deposit"; `type`: `string` = "uint256" }[] ; `internalType`: `string` = "struct IStakeManager.DepositInfo"; `name`: `string` = "info"; `type`: `string` = "tuple" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous?`: `undefined` = false; `inputs`: (\{ `components?`: `undefined` ; `internalType`: `string` = "bytes"; `name`: `string` = "callData"; `type`: `string` = "bytes" } \| \{ `components`: (\{ `components`: \{ `internalType`: ... = "address"; `name`: ... = "sender"; `type`: ... = "address" }[] ; `internalType`: `string` = "struct EntryPoint.MemoryUserOp"; `name`: `string` = "mUserOp"; `type`: `string` = "tuple" } \| \{ `components?`: `undefined` ; `internalType`: `string` = "bytes32"; `name`: `string` = "userOpHash"; `type`: `string` = "bytes32" })[] ; `internalType`: `string` = "struct EntryPoint.UserOpInfo"; `name`: `string` = "opInfo"; `type`: `string` = "tuple" })[] ; `name`: `string` = "innerHandleOp"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "actualGasCost"; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous?`: `undefined` = false; `inputs?`: `undefined` ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "payable"; `type`: `string` = "receive" })[]

#### Defined in

[ABI/ABI_EntryPoint.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_EntryPoint.ts#L3)

___

### ABI\_Errors

• **ABI\_Errors**: \{ `inputs`: `never`[] = []; `name`: `string` = "ADDRESS\_ALREADY\_EXISTS"; `type`: `string` = "error" }[]

#### Defined in

[ABI/ABI_Errors.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_Errors.ts#L3)

___

### ABI\_HelloWorld

• **ABI\_HelloWorld**: \{ `inputs`: `never`[] = []; `name`: `string` = "output"; `outputs`: \{ `internalType`: `string` = "string"; `name`: `string` = ""; `type`: `string` = "string" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" }[]

#### Defined in

[ABI/ABI_HelloWorld.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_HelloWorld.ts#L3)

___

### ABI\_NewImplementation

• **ABI\_NewImplementation**: (\{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "CURRENT\_UPGRADE\_SLOT"; `outputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = ""; `type`: `string` = "bytes32" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32[]"; `name`: `string` = "owners"; `type`: `string` = "bytes32[]" }[] ; `name`: `string` = "initialize"; `outputs`: `never`[] = []; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = false; `internalType`: `string` = "uint64"; `name`: `string` = "version"; `type`: `string` = "uint64" }[] ; `name`: `string` = "Initialized"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "INVALID\_LOGIC\_ADDRESS"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_NewImplementation.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_NewImplementation.ts#L3)

___

### ABI\_ReceivePayment

• **ABI\_ReceivePayment**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_owner"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name`: `string` = "owner"; `outputs`: \{ `internalType`: `string` = "address"; `name`: `string` = ""; `type`: `string` = "address" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = "\_paymentId"; `type`: `string` = "bytes32" }[] ; `name`: `string` = "pay"; `outputs`: `never`[] = []; `stateMutability`: `string` = "payable"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "previousOwner"; `type`: `string` = "address" }[] ; `name`: `string` = "OwnershipTransferred"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_ReceivePayment.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_ReceivePayment.ts#L3)

___

### ABI\_SocialRecoveryModule

• **ABI\_SocialRecoveryModule**: (\{ `anonymous?`: `undefined` = false; `inputs`: `never`[] = []; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes32"; `name`: `string` = ""; `type`: `string` = "bytes32" }[] ; `name`: `string` = "approvedHashes"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = ""; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "guardian"; `type`: `string` = "address" }[] ; `name`: `string` = "ApproveHash"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = "length"; `type`: `string` = "uint256" }[] ; `name`: `string` = "ECDSAInvalidSignatureLength"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_SocialRecoveryModule.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_SocialRecoveryModule.ts#L3)

___

### ABI\_TestOracle

• **ABI\_TestOracle**: (\{ `inputs`: \{ `internalType`: `string` = "int256"; `name`: `string` = "\_price"; `type`: `string` = "int256" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `inputs`: `never`[] = []; `name`: `string` = "decimals"; `outputs`: \{ `internalType`: `string` = "uint8"; `name`: `string` = ""; `type`: `string` = "uint8" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" })[]

#### Defined in

[ABI/ABI_TestOracle.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_TestOracle.ts#L3)

___

### ABI\_TokenERC20

• **ABI\_TokenERC20**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "uint8"; `name`: `string` = "\_decimals"; `type`: `string` = "uint8" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "allowance"; `outputs`: \{ `internalType`: `string` = "uint256"; `name`: `string` = ""; `type`: `string` = "uint256" }[] ; `stateMutability`: `string` = "view"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "owner"; `type`: `string` = "address" }[] ; `name`: `string` = "Approval"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "spender"; `type`: `string` = "address" }[] ; `name`: `string` = "ERC20InsufficientAllowance"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "error" })[]

#### Defined in

[ABI/ABI_TokenERC20.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_TokenERC20.ts#L3)

___

### ABI\_UpgradeModule

• **ABI\_UpgradeModule**: (\{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "address"; `name`: `string` = "\_newImplementation"; `type`: `string` = "address" }[] ; `name?`: `undefined` = "OwnableInvalidOwner"; `outputs?`: `undefined` ; `stateMutability`: `string` = "nonpayable"; `type`: `string` = "constructor" } \| \{ `anonymous?`: `undefined` = false; `inputs`: \{ `internalType`: `string` = "bytes4"; `name`: `string` = "interfaceId"; `type`: `string` = "bytes4" }[] ; `name`: `string` = "supportsInterface"; `outputs`: \{ `internalType`: `string` = "bool"; `name`: `string` = ""; `type`: `string` = "bool" }[] ; `stateMutability`: `string` = "pure"; `type`: `string` = "function" } \| \{ `anonymous`: `boolean` = false; `inputs`: \{ `indexed`: `boolean` = true; `internalType`: `string` = "address"; `name`: `string` = "wallet"; `type`: `string` = "address" }[] ; `name`: `string` = "ModuleDeInit"; `outputs?`: `undefined` ; `stateMutability?`: `undefined` = "view"; `type`: `string` = "event" })[]

#### Defined in

[ABI/ABI_UpgradeModule.ts:3](https://github.com/SoulWallet/elytro-wallet-lib/blob/179e9ead428fdbe246d2e7c57356d8786d712066/packages/abi/src/ABI/ABI_UpgradeModule.ts#L3)
