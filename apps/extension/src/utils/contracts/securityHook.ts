import { Address, encodeFunctionData, parseAbi, toHex, pad } from 'viem';
import { DEFAULT_SECURITY_HOOK_CONFIG } from '@/constants/securityHook';

/**
 * Get transaction to install SecurityHook
 * @param walletAddress Wallet address
 * @param securityHookAddress SecurityHook contract address
 * @param safetyDelay Safety delay (seconds)
 * @param capabilityFlags Capability flags
 * @returns Transaction parameters
 */
export const getInstallSecurityHookTx = (
  walletAddress: Address,
  securityHookAddress: Address,
  safetyDelay: number = DEFAULT_SECURITY_HOOK_CONFIG.safetyDelay,
  capabilityFlags: number = DEFAULT_SECURITY_HOOK_CONFIG.capabilityFlags
): Partial<TTransactionInfo> => {
  // Encode safetyDelay as 4-byte hex string (without 0x prefix)
  const safetyDelayHex = pad(toHex(safetyDelay), { size: 4 }).slice(2);

  // hookAndData = securityHookAddress (20 bytes) + safetyDelay (4 bytes)
  const hookAndData = securityHookAddress + safetyDelayHex;

  const callData = encodeFunctionData({
    abi: parseAbi(['function installHook(bytes calldata hookAndData, uint8 capabilityFlags)']),
    functionName: 'installHook',
    args: [hookAndData as `0x${string}`, capabilityFlags],
  });

  return {
    to: walletAddress,
    value: '0',
    data: callData,
  };
};

/**
 * Get transaction to uninstall SecurityHook
 * @param walletAddress Wallet address
 * @param securityHookAddress SecurityHook contract address
 * @returns Transaction parameters
 */
export const getUninstallSecurityHookTx = (
  walletAddress: Address,
  securityHookAddress: Address
): Partial<TTransactionInfo> => {
  const callData = encodeFunctionData({
    abi: parseAbi(['function uninstallHook(address)']),
    functionName: 'uninstallHook',
    args: [securityHookAddress],
  });

  return {
    to: walletAddress,
    value: '0',
    data: callData,
  };
};

/**
 * Get transaction for force uninstall step 1 (request force uninstall)
 * @param securityHookAddress SecurityHook contract address
 * @returns Transaction parameters
 */
export const getForcePreUninstallSecurityHookTx = (securityHookAddress: Address): Partial<TTransactionInfo> => {
  const callData = encodeFunctionData({
    abi: parseAbi(['function forcePreUninstall()']),
    functionName: 'forcePreUninstall',
    args: [],
  });

  return {
    to: securityHookAddress,
    value: '0',
    data: callData,
  };
};
