import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from './constants/chains';

const WALLETCONNECT_PROJECT_ID = '8cbad7c19c42240ceef404623a8e5efc';

export function getConfig() {
  return createConfig({
    chains: SUPPORTED_CHAINS,
    connectors: [
      // injected({
      //   target: 'metaMask',
      // }),
      metaMask(),
      coinbaseWallet({
        appName: 'Elytro Wallet Recovery',
      }),
      walletConnect({
        projectId: WALLETCONNECT_PROJECT_ID,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: false,
    transports: Object.fromEntries(
      SUPPORTED_CHAINS.map((chain) => [chain.id, http()])
    ),
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
