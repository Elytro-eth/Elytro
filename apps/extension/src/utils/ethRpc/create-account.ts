import {
  mutate,
  mutate_create_account,
  mutate_register_device,
} from '@/requests/mutate';
import { toHex } from 'viem';
import { localStorage } from '../storage/local';

export const createAccount = async (
  address: string,
  chainID: number,
  index: number,
  initialKeysStrArr: string[],
  initialGuardianHash: string,
  initialGuardianSafePeriod: number
) => {
  try {
    await mutate(mutate_create_account, {
      input: {
        address,
        chainID: toHex(chainID),
        initInfo: {
          index: index,
          initialKeys: initialKeysStrArr,
          initialGuardianHash: initialGuardianHash,
          initialGuardianSafePeriod: toHex(initialGuardianSafePeriod),
        },
      },
    });

    const token = await localStorage.get('fcmToken');

    if (token) {
      await mutate(mutate_register_device, {
        input: {
          deviceID: `firebase:${token}`,
          accounts: [{ address, chainID: toHex(chainID), pushOn: true }],
        },
      });
    } else {
      console.error(
        'Elytro::createAccount:: No token found thus cannot register device'
      );
    }
  } catch (error) {
    console.error(
      'Elytro: Something went wrong when send create wallet info to backend',
      error
    );
  }
};
