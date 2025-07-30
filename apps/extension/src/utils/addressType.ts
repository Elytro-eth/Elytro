import { PublicClient } from 'viem';

export type AddressType = 'EOA' | 'CONTRACT' | 'UNKNOWN';

export async function detectAddressType(address: string, client: PublicClient): Promise<AddressType> {
  try {
    const code = await client.getCode({ address: address as `0x${string}` });

    if (!code || code === '0x') {
      return 'EOA';
    }

    return 'CONTRACT';
  } catch {
    return 'UNKNOWN';
  }
}
