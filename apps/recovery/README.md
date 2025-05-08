This is the Recovery App for Elytro users to help them recover their wallets. Recovery contacts of an Elytro wallet can connect to this dapp and help the user recover their wallet.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## use `.env` for API Keys

Create a new file named `.env` in the root directory of the project. In this file, add the following lines:

```
# Alchemy API Keys
VITE_ALCHEMY_API_KEY=your_alchemy_api_key

# Pimlico API Keys
VITE_PIMLICO_API_KEY=your_pimlico_api_key
```

Replace `your_alchemy_api_key` and `your_pimlico_api_key` with your actual API keys.

## TODO

They are plenty of TODOs in the codebase.

-[] Most of the TODOs are about replacing reuseable components which can be extracted from apps/extension to libs/shared-components project. For example, the <ProcessingTip/>, <Button/>, <ChainItem/>, etc.

-[] Make common config files reusable in this monorepo, e.g. the tailwindcss config files.
