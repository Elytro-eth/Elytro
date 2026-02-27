import type { Address, Hex } from 'viem';
import { encodeFunctionData, parseUnits } from 'viem';
import type { WalletClientService } from '../services/walletClient';

/**
 * Minimal ERC-20 ABI — only the functions needed for CLI operations.
 */
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

/**
 * Query token symbol and decimals from the chain.
 */
export async function getTokenInfo(
  walletClient: WalletClientService,
  tokenAddress: Address
): Promise<{ symbol: string; decimals: number }> {
  const [symbol, decimals] = await Promise.all([
    walletClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
    }) as Promise<string>,
    walletClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }) as Promise<number>,
  ]);

  return { symbol, decimals };
}

/**
 * Query ERC-20 balance of an account.
 */
export async function getTokenBalance(
  walletClient: WalletClientService,
  tokenAddress: Address,
  account: Address
): Promise<bigint> {
  return walletClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account],
  }) as Promise<bigint>;
}

/**
 * Encode an ERC-20 transfer(to, amount) call.
 */
export function encodeTransfer(to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });
}

/**
 * Parse a human-readable amount to the token's smallest unit.
 *
 * e.g. parseTokenAmount('1.5', 6) → 1500000n (USDC)
 *      parseTokenAmount('0.1', 18) → 100000000000000000n (DAI)
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}
