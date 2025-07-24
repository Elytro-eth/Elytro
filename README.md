> **IMPORTANT FOR NON-DEVELOPERS:**
> If you are not a developer and want to run Elytro locally, please read [GETTING_STARTED_FOR_NON_DEVS.md](./GETTING_STARTED_FOR_NON_DEVS.md) first for a simple, step-by-step guide!

# Elytro Monorepo

---

## Quick Start Script (Recommended for NON- or Junior Developers)

You can set up and run everything with a single command using the provided script:

```bash
./quickstart.sh
```

- This script will:
  1. Check/install prerequisites
  2. Install dependencies
  3. Start both the extension and recovery app dev servers
  4. Show you how to load the extension in Chrome

If you see a permissions error, run:

```bash
chmod +x quickstart.sh
```

---

**Elytro** is a modular ERC-4337 smart wallet system for the EVM ecosystem. This monorepo contains the browser extension wallet and the social recovery web application.

## Applications

### `apps/extension`

A Chrome extension implementing an ERC-4337 smart contract wallet.
Built with React, TypeScript, Vite, and Tailwind CSS.
Supports multi-chain access, account abstraction, and contact-based recovery.

See [`apps/extension/README.md`](apps/extension/README.md) for details.

### `apps/recovery`

A Next.js 14 web app that enables secure wallet recovery via trusted contacts.
Guides users through multi-step verification and on-chain recovery.

See [`apps/recovery/README.md`](apps/recovery/README.md) for details.

Here is an [example link](https://recovery.elytro.com/?id=0x541759739e8a737bb885e87d5c5b22e80330f2e0a574543ca8c8590fcd3e33e0&address=0x27c310bc5E5fEDb0e8833DB4CeB31C93CC246dA5&chainId=11155111&hash=0xacd27c858e64d4fa7a560a8e1de45d1186acea0d8b850bc052ceb87369477d4d&from=8827934&owner=0xdAc441aaD418D8E323ADEaE6dCD4261de7fFB4dd) to show you how it works.

## Setup

### Recommended Environment

To ensure compatibility, use the following versions:

- **Node.js**: `22.15.x`
- **pnpm**: `9.15.x`

Check your versions with:

```bash
node -v
pnpm -v
```

### Install Dependencies

```bash
pnpm install
```

### Start Dev Servers

Run the extension:

```bash
pnpm --filter extension dev
```

Run the recovery app:

```bash
pnpm --filter recovery dev
```

## Monorepo Structure

```
apps/           # Application projects
├── extension/  # Elytro Chrome extension
├── recovery/   # Recovery web interface

packages/       # Shared libraries (WIP, do not use)
configs/        # Shared config (eslint, tailwind, tsconfig, etc.)
```

> ⚠️ `packages/` is under development and not production-ready. Do not import from shared packages at this stage.

## Tooling

- **pnpm** for workspace management
- **Turborepo** for task orchestration
- **TypeScript** with strict mode enabled
- **ESLint / Prettier** for code formatting
- **Husky** for optional Git hook support

## License

[GNU](/LICENSE)
