// https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.x.0
export const ENTRYPOINTS_ADDRESSES = {
  // 'v0.6': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  'v0.7': '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  'v0.8': '0x4337084d9e255ff0702461cf8895ce9e3b5ff108',
};

export const SUPPORTED_ENTRYPOINT_VERSIONS = Object.keys(ENTRYPOINTS_ADDRESSES);
export const DEFAULT_ENTRYPOINT_VERSION = 'v0.8';
export const DEFAULT_ENTRYPOINT_ADDRESS =
  ENTRYPOINTS_ADDRESSES[DEFAULT_ENTRYPOINT_VERSION];

export const getVersionByAddress = (address: string) => {
  const version = SUPPORTED_ENTRYPOINT_VERSIONS.find((version) =>
    ENTRYPOINTS_ADDRESSES[version as keyof typeof ENTRYPOINTS_ADDRESSES]
      .toLowerCase()
      .includes(address.toLowerCase())
  );
  return version;
};

export type TSDKConfigItem = {
  factory: string;
  fallback: string;
  recovery: string;
  validator: string;
  infoRecorder: string;
  onchainConfig: {
    entryPoint: string;
    soulWalletLogic: string;
  };
};

export const SDK_CONFIG_BY_ENTRYPOINT = {
  [ENTRYPOINTS_ADDRESSES['v0.7']]: {
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
    onchainConfig: {
      entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      soulWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
    },
  },

  [ENTRYPOINTS_ADDRESSES['v0.8']]: {
    factory: '0xdE9845C5349ad08E0A1B3c311aeAfd3C4Fd7fC8F',
    fallback: '0xDe5baB4EFE758e453dCf7ed2Bf08ce373436425D',
    // TODO: check if recovery should change
    recovery: '0x456e9D9092492Ceaa05DAF1c590c829674d32472',
    validator: '0xDc7007F20355219a5A6eB13f247F2E723df46cEb',
    infoRecorder: '0x456e9D9092492Ceaa05DAF1c590c829674d32472',
    onchainConfig: {
      entryPoint: '0x4337084d9e255ff0702461cf8895ce9e3b5ff108',
      soulWalletLogic: '0x11Ff2Ab6C03049d0678681Cf3d6191dA46F9aFe9',
    },
  },
};
