import { localStorage } from '@/utils/storage/local';

const ELYTRO_RECENT_ADDRESS_STORE = 'ELYTRO_RECENT_ADDRESS_STORE';

/**
 * Save an address to recent addresses
 */
export const saveRecentAddress = async (
  data: TRecentAddress
): Promise<void> => {
  try {
    const storedData = await localStorage.get<Record<string, TRecentAddress>>(
      ELYTRO_RECENT_ADDRESS_STORE
    );
    let parsedData: Record<string, TRecentAddress> = {};

    if (storedData) {
      parsedData = storedData as Record<string, TRecentAddress>;
    }

    if (!parsedData[data.address]) {
      parsedData[data.address] = data;
      localStorage.save({
        [ELYTRO_RECENT_ADDRESS_STORE]: parsedData,
      });
    }
  } catch (e) {
    console.error('Error saving recent address:', e);
  }
};

/**
 * Get all recent addresses
 */
export const getRecentAddresses = async (): Promise<Record<
  string,
  TRecentAddress
> | null> => {
  try {
    const storedData = await localStorage.get<Record<string, TRecentAddress>>(
      ELYTRO_RECENT_ADDRESS_STORE
    );
    if (storedData) {
      return storedData as Record<string, TRecentAddress>;
    }
    return null;
  } catch (e) {
    console.error('Error loading recent addresses:', e);
    return null;
  }
};

/**
 * Get recent addresses as an array
 */
export const getRecentAddressesAsArray = async (): Promise<
  TRecentAddress[]
> => {
  const addresses = await getRecentAddresses();
  if (addresses) {
    return Object.values(addresses);
  }
  return [];
};

/**
 * Clear all recent addresses
 */
export const clearRecentAddresses = async (): Promise<void> => {
  try {
    await localStorage.remove([ELYTRO_RECENT_ADDRESS_STORE]);
  } catch (e) {
    console.error('Error clearing recent addresses:', e);
  }
};
