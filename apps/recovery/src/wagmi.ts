import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from './constants/chains';
import metamaskIcon from './app/metamask.svg';
const WALLETCONNECT_PROJECT_ID = '8cbad7c19c42240ceef404623a8e5efc';

export const CONNECTOR_ICON_MAP = {
  metaMaskSDK: metamaskIcon,
  coinbaseWalletSDK:
    'https://gist.githubusercontent.com/taycaldwell/2291907115c0bb5589bc346661435007/raw/280eafdc84cb80ed0c60e36b4d0c563f6dca6b3e/cbw.svg',
  walletConnect:
    'https://logosarchive.com/wp-content/uploads/2022/02/WalletConnect-icon.svg',
};

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
