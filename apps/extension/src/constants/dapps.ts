import aave from '@/assets/icons/aave.svg';
import lido from '@/assets/icons/lido.svg';
import logo from '@/assets/logo.svg';
import ens from '@/assets/icons/ens.svg';
import opensea from '@/assets/icons/opensea.svg';
import cowswap from '@/assets/icons/cowswap.svg';
import relay from '@/assets/icons/relay.svg';

export const ENCOURAGE_DAPPS = [
  {
    name: 'ENS',
    label: 'Names',
    url: 'https://app.ens.domains/',
    icon: ens,
  },
  {
    name: 'Aave',
    label: 'Lend',
    url: 'https://app.aave.com/',
    icon: aave,
  },
  {
    name: 'Lido',
    label: 'Stake',
    url: 'https://stake.lido.fi/',
    icon: lido,
  },
  {
    name: 'OpenSea',
    label: 'NFT',
    url: 'https://opensea.io/',
    icon: opensea,
  },
  {
    name: 'CoW Swap',
    label: 'Swap',
    url: 'https://swap.cow.fi/',
    icon: cowswap,
  },
  {
    name: 'Relay',
    label: 'Bridge',
    url: 'https://www.relay.link/bridge',
    icon: relay,
  },
];

export const ELYTRO_APP_DATA: TDAppInfo = {
  name: 'Elytro',
  origin: 'https://elytro.com',
  icon: logo,
};
