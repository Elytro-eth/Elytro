import { Address } from 'viem';
import { optimismSepolia, sepolia } from 'viem/chains';

type TVersion = `${number}.${number}.${number}`;

type TVersionInfo = {
  latestVersion: TVersion;
  versionModuleAddress: Record<TVersion, Address>;
};

type TChainVersionInfo = Record<number, TVersionInfo>;

export const VERSION_MODULE_ADDRESS_MAP: TChainVersionInfo = {
  [optimismSepolia.id]: {
    latestVersion: '1.1.1',
    versionModuleAddress: {
      '1.1.1': '0x02eAdC2B39546Ee61014312801d03Ff4e68087c4',
    },
  },
  [sepolia.id]: {
    latestVersion: '1.1.1',
    versionModuleAddress: {
      '1.1.1': '0x02eAdC2B39546Ee61014312801d03Ff4e68087c4',
    },
  },
};
