// https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.x.0
export const ENTRYPOINTS_ADDRESSES = {
  // 'v0.6': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  'v0.7': '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  'v0.8': '0x4337084d9e255ff0702461cf8895ce9e3b5ff108',
  'v0.9': '0x433709009B8330FDa32311DF1C2AFA402eD8D009',
};

export const SUPPORTED_ENTRYPOINT_VERSIONS = Object.keys(ENTRYPOINTS_ADDRESSES);
export const DEFAULT_ENTRYPOINT_VERSION = 'v0.9';
export const DEFAULT_ENTRYPOINT_ADDRESS = ENTRYPOINTS_ADDRESSES[DEFAULT_ENTRYPOINT_VERSION];

export const getVersionByAddress = (address: string) => {
  const version = SUPPORTED_ENTRYPOINT_VERSIONS.find((version) =>
    ENTRYPOINTS_ADDRESSES[version as keyof typeof ENTRYPOINTS_ADDRESSES].toLowerCase().includes(address.toLowerCase())
  );
  return version;
};

export type TSDKConfigItem = {
  factory: string;
  fallback: string;
  recovery: string;
  validator: string;
  infoRecorder: string;
  entryPoint: string;
  elytroWalletLogic: string;
};

export const SDK_CONFIG_BY_ENTRYPOINT = {
  [ENTRYPOINTS_ADDRESSES['v0.7']]: {
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    elytroWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
  },

  [ENTRYPOINTS_ADDRESSES['v0.8']]: {
    factory: '0x82a8B1a5986f565a1546672e8939daA1b20F441E',
    fallback: '0xB73Ec2FD0189202F6C22067Eeb19EAad25CAB551',
    recovery: '0xAFEF5D8Fb7B4650B1724a23e40633f720813c731',
    validator: '0xea50a2874df3eEC9E0365425ba948989cd63FED6', // 0xDc7007F20355219a5A6eB13f247F2E723df46cEb
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    entryPoint: '0x4337084d9e255ff0702461cf8895ce9e3b5ff108',
    elytroWalletLogic: '0x2CC8A41e26dAC15F1D11F333f74D0451be6caE36',
  },

  [ENTRYPOINTS_ADDRESSES['v0.9']]: {
    factory: '0x29De7F0373EE785ae62FE2954BF955820F314757',
    fallback: '0xB73Ec2FD0189202F6C22067Eeb19EAad25CAB551',
    recovery: '0xAFEF5D8Fb7B4650B1724a23e40633f720813c731',
    validator: '0x4625d114a520c556C8d35C428A05c1E034f43Bb4', // 0xDc7007F20355219a5A6eB13f247F2E723df46cEb
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    entryPoint: '0x433709009B8330FDa32311DF1C2AFA402eD8D009',
    elytroWalletLogic: '0xd86516319dc25638b7126ab8a45a268704885ab4',
  },
};
