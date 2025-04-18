// import { ABI_SoulWallet, ABI_UpgradeModule} from '@soulwallet/abi';
import { Address, encodeFunctionData, parseAbi } from 'viem';

export const getInstallModuleTx = (
  walletAddress: Address,
  latestModuleAddress: Address
): Partial<TTransactionInfo> => {
  // const callData = encodeFunctionData({
  //   abi: ABI_SoulWallet,
  //   functionName: 'installModule',
  //   args: [
  //     LATEST_MODULE_ADDRESS /* 安装的升级模块，升级模块不需要参数，所以只需要传入模块地址就可以，如果需要参数则参数需要以16进制的方式拼接在模块地址后面 */,
  //   ],
  // });

  const callData = encodeFunctionData({
    abi: parseAbi(['function installModule(bytes)']),
    functionName: 'installModule',
    args: [latestModuleAddress],
  });

  return {
    to: walletAddress,
    value: '0',
    data: callData,
  };
};

export const getUpgradeModuleTx = (
  walletAddress: Address,
  latestModuleAddress: Address
) => {
  // const callData = encodeFunctionData({
  //   abi: ABI_UpgradeModule,
  //   functionName: 'upgrade',
  //   args: [walletAddress as `0x${string}`],
  // });
  const callData = encodeFunctionData({
    abi: parseAbi(['function upgrade(address)']),
    functionName: 'upgrade',
    args: [walletAddress as `0x${string}`],
  });

  return {
    to: latestModuleAddress,
    value: '0',
    data: callData,
  };
};

export const getUninstallModuleTx = (
  walletAddress: Address,
  moduleAddress: Address
) => {
  // const callData = encodeFunctionData({
  //   abi:ABI_SoulWallet,
  //   functionName: 'uninstallModule',
  //   args: [walletAddress as `0x${string}`],
  // });
  const callData = encodeFunctionData({
    abi: parseAbi(['function uninstallModule(address)']),
    functionName: 'uninstallModule',
    args: [moduleAddress as `0x${string}`],
  });

  return {
    to: walletAddress,
    value: '0',
    data: callData,
  };
};
