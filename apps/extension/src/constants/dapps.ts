import { aaveIcon, lidoIcon, logoSvg, ensIcon, cowswapIcon, relayIcon, privacypoolsIcon } from '@elytro/ui/assets';

export const ENCOURAGE_DAPPS = [
  {
    name: 'ENS',
    label: 'Names',
    url: 'https://app.ens.domains/',
    icon: ensIcon,
  },
  {
    name: 'Aave',
    label: 'Lend',
    url: 'https://app.aave.com/',
    icon: aaveIcon,
  },
  {
    name: 'Lido',
    label: 'Stake',
    url: 'https://stake.lido.fi/',
    icon: lidoIcon,
  },
  // {
  //   name: 'OpenSea',
  //   label: 'NFT',
  //   url: 'https://opensea.io/',
  //   icon: opensea,
  // },
  {
    name: 'CoW Swap',
    label: 'Swap',
    url: 'https://swap.cow.fi/',
    icon: cowswapIcon,
  },
  {
    name: 'Relay',
    label: 'Bridge',
    url: 'https://www.relay.link/bridge',
    icon: relayIcon,
  },
  {
    name: 'PrivacyPools',
    label: 'Privacy',
    url: 'https://privacypools.com/',
    icon: privacypoolsIcon,
  },
];

export const ELYTRO_APP_DATA: TDAppInfo = {
  name: 'Elytro',
  origin: 'https://elytro.com',
  icon: logoSvg,
};
