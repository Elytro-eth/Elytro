import { type Address, type Hex, encodeFunctionData, parseAbi, pad, toHex } from 'viem';
import { DEFAULT_SAFETY_DELAY, DEFAULT_CAPABILITY } from '../../constants/securityHook';

/**
 * Encode `installHook(hookAndData, capabilityFlags)` calldata.
 *
 * hookAndData = hookAddress (20 bytes) + safetyDelay (4 bytes, big-endian)
 * The call target is the wallet itself (self-call via UserOp).
 */
export function encodeInstallHook(
  walletAddress: Address,
  hookAddress: Address,
  safetyDelay: number = DEFAULT_SAFETY_DELAY,
  capabilityFlags: number = DEFAULT_CAPABILITY
): { to: Address; value: string; data: Hex } {
  const safetyDelayHex = pad(toHex(safetyDelay), { size: 4 }).slice(2);
  const hookAndData = (hookAddress + safetyDelayHex) as Hex;

  const callData = encodeFunctionData({
    abi: parseAbi(['function installHook(bytes calldata hookAndData, uint8 capabilityFlags)']),
    functionName: 'installHook',
    args: [hookAndData, capabilityFlags],
  });

  return { to: walletAddress, value: '0', data: callData };
}

/**
 * Encode `uninstallHook(address)` calldata.
 * Call target is the wallet itself.
 */
export function encodeUninstallHook(
  walletAddress: Address,
  hookAddress: Address
): { to: Address; value: string; data: Hex } {
  const callData = encodeFunctionData({
    abi: parseAbi(['function uninstallHook(address)']),
    functionName: 'uninstallHook',
    args: [hookAddress],
  });

  return { to: walletAddress, value: '0', data: callData };
}

/**
 * Encode `forcePreUninstall()` calldata.
 * Call target is the SecurityHook contract (not the wallet).
 */
export function encodeForcePreUninstall(hookAddress: Address): { to: Address; value: string; data: Hex } {
  const callData = encodeFunctionData({
    abi: parseAbi(['function forcePreUninstall()']),
    functionName: 'forcePreUninstall',
    args: [],
  });

  return { to: hookAddress, value: '0', data: callData };
}
