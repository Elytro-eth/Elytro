import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an Ethereum address to a shortened display format.
 * Example: 0x1234567890abcdef... -> 0x12345 ... cdef
 */
export function formatAddressToShort(address: string | null | undefined): string {
  if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length < 12) {
    return '--';
  }
  return `${address.slice(0, 7)} ... ${address.slice(-5)}`;
}
