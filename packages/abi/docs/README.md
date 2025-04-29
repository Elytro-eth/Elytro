@elytro/abi / [Modules](modules.md)

<h1 align="center">
   <b>
        @elytro/abi
    </b>
</h1>

<p align="center">
soulwallet-contract ABI
</p>

<p align="center">
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/tree/develop/packages/abi"><b>Code</b></a> •
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/blob/develop/packages/abi/docs/modules.md"><b>Documentation</b></a>
</p>

## Table of Contents

  - [Installing](#installing)
    
  - [Example](#example)

  - [License](#license)

## Installing

Using npm:

```bash
$ npm install @elytro/abi
```

Using yarn:

```bash
$ yarn add @elytro/abi
```

Using pnpm:

```bash
$ pnpm add @elytro/abi
```

Once the package is installed, you can import the library using `import` approach:

```bash
import { ABI_Elytro } from '@elytro/abi'
```

## Example

```typescript
import { 
    ABI_KeyStore,
    ABI_Elytro,
    ABI_ElytroFactory,
    ABI_ElytroProxy,
    ABI_Simple2FA,
    ABI_Dailylimit,
    ABI_SecurityControlModule,
    ABI_SocialRecoveryModule,
    ABI_Upgrade,
    ABI_TrustedModuleManager,
    ABI_TrustedPluginManager,
    ABI_OpKnownStateRootWithHistory,
    ABI_ArbKnownStateRootWithHistory,
    ABI_KeyStoreModule,
    ABI_KeystoreProof,
    ABI_ERC20Paymaster,
    ABI_EntryPoint
} from '@elytro/abi'
```

## License

ISC
