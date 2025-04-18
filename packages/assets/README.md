<h1 align="center">
   <b>
        @elytro/assets
    </b>
</h1>

<p align="center">
A database of token
</p>

<p align="center">
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/tree/develop/packages/assets"><b>Code</b></a> •
    <a href="https://github.com/SoulWallet/elytro-wallet-lib/blob/develop/packages/assets/docs/modules.md"><b>Documentation</b></a>
</p>


## Table of Contents

  - [Installing](#installing)
    
  - [Example](#example)

  - [License](#license)



## Installing

Using npm:

```bash
$ npm install @elytro/assets
```

Using yarn:

```bash
$ yarn add @elytro/assets
```

Using pnpm:

```bash
$ pnpm add @elytro/assets
```

Once the package is installed, you can import the library using `import` approach:

```bash
import { getAsset } from "@elytro/assets";
```



## Example

```typescript
import { getAsset } from "@elytro/assets";

async function main(chainId: number, address: string) {
    const ret = await getAsset(chainId, address);
    if (ret.isOk()) {
        console.log(ret.OK);
    }
}
```



## License

ISC