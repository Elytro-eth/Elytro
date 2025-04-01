import { Input } from '@/components/ui/input';
import {
  PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from 'react';
import { FieldValues } from 'react-hook-form';
import { isAddress } from 'viem';
import FragmentedAddress from './FragmentedAddress';
import ENSInfoComponent, { EnsAddress } from './ENSInfo';
import { useWallet } from '@/contexts/wallet';
import Spin from '@/components/ui/Spin';
import dayjs from 'dayjs';
import { localStorage } from '@/utils/storage/local';
import { debounce } from 'lodash';

const ELYTRO_RECENT_ADDRESS_STORE = 'ELYTRO_RECENT_ADDRESS_STORE';

const RecentAddressItem = memo(
  ({
    item,
    chainId,
    onClick,
  }: {
    item: EnsAddress;
    chainId: number;
    onClick: () => void;
  }) => {
    const hour = dayjs().diff(item.time, 'h');

    return (
      <div
        onClick={onClick}
        className="px-lg py-md cursor-pointer flex items-center justify-between hover:bg-gray-150"
      >
        {item.name ? (
          <ENSInfoComponent ensInfo={item} />
        ) : (
          <FragmentedAddress
            size="md"
            address={item.address}
            chainId={chainId}
          />
        )}
        <div className="text-gray-600 text-xs font-normal">
          {hour > 1 ? `${hour}hrs` : 'An hr'} ago
        </div>
      </div>
    );
  }
);

RecentAddressItem.displayName = 'RecentAddressItem';

const AddressInput = ({
  field,
  chainId,
}: PropsWithChildren<{
  field: FieldValues;
  chainId: number;
}>) => {
  const { wallet } = useWallet();
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [ensInfo, setEnsInfo] = useState<EnsAddress | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [recentAddress, setRecentAddress] = useState<{
    [key: string]: EnsAddress;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickENS = useCallback(
    (ens?: EnsAddress) => {
      if (ens) {
        setEnsInfo(ens);
        field.onChange(ens.address);
        setValue(ens.name as string);
        setDisplayLabel('');
        return;
      }
      if (ensInfo) {
        field.onChange(ensInfo.address);
      }
    },
    [ensInfo, field]
  );

  const handleClickRecentAddress = useCallback(
    (item: EnsAddress) => {
      setDisplayLabel(item.address);
      setValue(item.address);
      field.onChange(item.address);
      setIsFocused(false);
    },
    [field]
  );

  const debouncedGetENSAddress = useCallback(
    debounce(async (value: string) => {
      try {
        const existedEns = Object.values(recentAddress || {}).find(
          (item) => item.name === value
        );
        const needToSearch = value.endsWith('.eth') && !existedEns;

        if (!needToSearch) {
          if (ensInfo) {
            setEnsInfo(null);
          }
          if (existedEns) {
            setEnsInfo(existedEns);
          }
          setLoading(false);
          return;
        }

        setLoading(true);
        const ensAddr = await wallet.getENSInfoByName(value);

        if (ensAddr) {
          setEnsInfo(ensAddr as EnsAddress);
        }
      } catch (error) {
        console.error(error);
        setEnsInfo(null);
      } finally {
        setLoading(false);
      }
    }, 300),
    [recentAddress, ensInfo, wallet]
  );

  const handleBlur = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const isAddr = isAddress(value);

      if (isAddr) {
        setDisplayLabel(value);
        saveRecentAddressStore({
          time: new Date().toISOString(),
          address: value,
        });
      } else if (value && !value.endsWith('.eth')) {
        setDisplayLabel('');
      } else {
        setDisplayLabel('');
      }

      if (ensInfo?.address) {
        field.onChange(ensInfo.address);
        saveRecentAddressStore({
          ...ensInfo,
          time: new Date().toISOString(),
        });
      } else {
        field.onChange(value);
      }

      setTimeout(() => setIsFocused(false), 200);
    },
    [ensInfo, field]
  );

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);

    if (value.endsWith('.eth')) {
      setLoading(true);
      debouncedGetENSAddress(value);
    } else if (ensInfo) {
      setEnsInfo(null);
    }
  };

  const genInputResult = useCallback(() => {
    if (displayLabel) {
      return (
        <div
          className="absolute bg-white"
          onClick={() => inputRef.current?.focus()}
        >
          <FragmentedAddress
            address={displayLabel}
            chainId={chainId}
            size="lg"
          />
        </div>
      );
    }
    if (ensInfo) {
      return (
        <div className="absolute bg-white">
          <ENSInfoComponent ensInfo={ensInfo} />
        </div>
      );
    }
    return null;
  }, [displayLabel, ensInfo, chainId]);

  const saveRecentAddressStore = useCallback(
    (data: EnsAddress) => {
      const isExist = recentAddress && recentAddress[data.address];
      if (!isExist) {
        const storedAddress = { ...recentAddress, [data.address]: data };
        localStorage.save({
          [ELYTRO_RECENT_ADDRESS_STORE]: JSON.stringify(storedAddress),
        });
      }
    },
    [recentAddress]
  );

  const getRecentAddressStore = useCallback(async () => {
    const address = await localStorage.get(ELYTRO_RECENT_ADDRESS_STORE);
    if (address) {
      setRecentAddress(address as { [key: string]: EnsAddress });
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      getRecentAddressStore();
    }
  }, [isFocused, getRecentAddressStore]);

  useEffect(() => {
    if (value.endsWith('.eth')) {
      debouncedGetENSAddress(value);
    }
  }, [value, debouncedGetENSAddress]);

  return (
    <div className="bg-white rounded-md p-sm flex flex-col mb-4 relative">
      <div className="flex items-center relative">
        <Input
          ref={inputRef}
          className="text-lg border-none"
          placeholder={
            !isFocused && !(displayLabel || ensInfo)
              ? 'Recipient address / ENS'
              : ''
          }
          value={isFocused ? value : displayLabel || ensInfo ? '' : value}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleChange}
        />
        {!isFocused && genInputResult()}
      </div>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-md rounded-md mt-1 z-10 overflow-hidden max-h-80 overflow-y-auto">
          {recentAddress && Object.values(recentAddress).length > 0 && (
            <div className="w-full">
              <div className="elytro-text-smaller-body text-gray-600 font-bold mt-xs px-lg py-sm">
                Recent
              </div>
              <div>
                {Object.values(recentAddress).map((item: EnsAddress) => (
                  <RecentAddressItem
                    key={item.address}
                    item={item}
                    chainId={chainId}
                    onClick={() => {
                      if (item.name) {
                        handleClickENS(item);
                      } else {
                        handleClickRecentAddress(item);
                      }
                      setIsFocused(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {(value.endsWith('.eth') || ensInfo || loading) && (
            <div>
              <div className="text-base text-gray-600 font-bold px-4 py-2">
                ENS Search
              </div>
              <div className="relative min-h-16">
                {<Spin isLoading={loading} />}
                {ensInfo && (
                  <div
                    className="px-4 h-16 cursor-pointer hover:bg-gray-300"
                    onClick={() => {
                      handleClickENS();
                      setIsFocused(false);
                    }}
                  >
                    <ENSInfoComponent ensInfo={ensInfo} />
                  </div>
                )}
                {!loading && !ensInfo && value.endsWith('.eth') && (
                  <div className="px-4 py-4 text-gray-500">
                    No ENS found for &quot;{value}&quot;
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading &&
            !ensInfo &&
            (!recentAddress || Object.values(recentAddress).length === 0) &&
            !value.endsWith('.eth') && (
              <div className="p-4 text-gray-500">
                No recent addresses. Enter an address or ENS name.
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
