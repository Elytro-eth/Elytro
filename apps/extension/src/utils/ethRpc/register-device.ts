import { mutate, mutate_register_device } from '@/requests/mutate';
import { toHex } from 'viem';

export const registerDevice = async (address: string, chainID: number) => {
  const token = await localStorage.get('fcmToken');

  try {
    if (!token || token.length === 0) {
      throw new Error('No token found');
    }

    await mutate(mutate_register_device, {
      input: {
        deviceID: token,
        accounts: [{ address, chainID: toHex(chainID), pushOn: true }],
      },
    });
  } catch (error) {
    console.error(
      'Elytro: Something went wrong when send register device info to backend',
      error
    );
  }
};
