import { TChainItem } from '@/constants/chains';
import { Input } from '@/components/ui/input';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { isAddress } from 'viem';
import FragmentedAddress from './FragmentedAddress';
import ENSInfoComponent, { EnsAddress } from './ENSInfo';
import { useWallet } from '@/contexts/wallet';
import Spin from '@/components/ui/Spin';
import dayjs from 'dayjs';
import { localStorage } from '@/utils/storage/local';

const ELYTRO_RECENT_ADDRESS_STORE = 'ELYTRO_RECENT_ADDRESS_STORE';

export default function AddressInput({
  field,
  currentChain,
}: PropsWithChildren<{
  field: FieldValues;
  currentChain: TChainItem | null;
}>) {
  const { wallet } = useWallet();
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [ensInfo, setEnsInfo] = useState<EnsAddress | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [recentAddress, setRecentAddress] = useState<{
    [key: string]: EnsAddress;
  } | null>(null);
  const handleClickENS = (ens?: EnsAddress) => {
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
  };

  const handleClickRecentAddress = (item: EnsAddress) => {
    setDisplayLabel(item.address);
    setValue(item.address);
    field.onChange(item.address);
  };

  const getENSAddress = async (value: string) => {
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
        return;
      }
      setLoading(true);
      const ensAddr = await wallet.getENSInfoByName(value);
      if (ensAddr) {
        setEnsInfo(ensAddr as EnsAddress);
      }
    } catch (error) {
      setEnsInfo(null);
      field.onChange(value);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isAddr = isAddress(value);
    if (isAddr) {
      setDisplayLabel(value);
      saveRecentAddressStore({
        time: new Date().toISOString(),
        address: value,
      });
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
    // delay to hide the dropdown for trigger the click event on it
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);
  };

  const genInputResult = () => {
    if (displayLabel) {
      return (
        <div className="absolute bg-white">
          <FragmentedAddress
            address={displayLabel}
            chainId={currentChain?.id}
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
  };

  const saveRecentAddressStore = (data: EnsAddress) => {
    const isExist = recentAddress && recentAddress[data.address];
    if (!isExist) {
      const storedAddress = { ...recentAddress, [data.address]: data };

      localStorage.save({
        [ELYTRO_RECENT_ADDRESS_STORE]: JSON.stringify(storedAddress),
      });
    }
  };

  const getRecentAddressStore = async () => {
    const address = await localStorage.get(ELYTRO_RECENT_ADDRESS_STORE);
    if (address) {
      setRecentAddress(address as { [key: string]: EnsAddress });
    }
  };

  useEffect(() => {
    getRecentAddressStore();
  }, [isFocused]);

  useEffect(() => {
    getENSAddress(value);
  }, [value]);

  return (
    <div className="bg-white rounded-md px-3 py-3 flex items-center mb-4 relative">
      <Input
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

      {isFocused && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-md rounded-md mt-1 z-10 overflow-hidden">
          {recentAddress && (
            <div className="w-full">
              <div className="text-base text-gray-600 font-bold p-4">
                Recent
              </div>
              <div>
                {Object.values(recentAddress).map((item: EnsAddress) => {
                  const handleClick = () => {
                    if (item.name) {
                      handleClickENS(item);
                    } else {
                      handleClickRecentAddress(item);
                    }
                  };
                  let Comp = null;
                  if (item.name) {
                    Comp = <ENSInfoComponent ensInfo={item} />;
                  } else {
                    Comp = (
                      <FragmentedAddress
                        size="md"
                        address={item.address}
                        chainId={currentChain?.id}
                      />
                    );
                  }
                  const hour = dayjs().diff(item.time, 'h');
                  return (
                    <div
                      key={item.address}
                      onClick={handleClick}
                      className="h-16 px-4 cursor-pointer flex items-center justify-between hover:bg-gray-300"
                    >
                      {Comp}
                      <div className="text-gray-600 text-sm font-normal">
                        {hour > 1 ? `${hour}hrs` : 'An hour'} ago
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {(ensInfo || loading) && (
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
