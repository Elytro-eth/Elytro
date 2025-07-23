# Elytro Monorepo

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
