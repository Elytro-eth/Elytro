import { Input } from '@/components/ui/input';
import { useEffect, useState, useRef } from 'react';
import { FieldValues } from 'react-hook-form';
import { isAddress } from 'viem';
import { useWallet } from '@/contexts/wallet';
import { debounce } from 'lodash';
import ENSSearchResults from './EnsSearch';
import RecentAddressesList from './RecentAddress';
import InputDisplay from './InputDisplay';
import { getRecentAddresses } from '@/utils/recentAddresses';

interface IAddressInputProps {
  field: FieldValues;
  chainId: number;
}

const AddressInput = ({ field, chainId }: IAddressInputProps) => {
  const { wallet } = useWallet();
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [ensInfo, setEnsInfo] = useState<TRecentAddress | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [recentAddresses, setRecentAddresses] = useState<TRecentAddress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) return;

    getRecentAddresses().then((addresses) => {
      if (addresses) {
        setRecentAddresses(Object.values(addresses));
      }
    });
  }, [isFocused]);

  const resolveENS = debounce(async (ensName: string) => {
    try {
      setLoading(true);

      if (!ensName.endsWith('.eth')) {
        setEnsInfo(null);
        return;
      }
      const existingENS = recentAddresses.find((item) => item.name === ensName);
      if (existingENS) {
        setEnsInfo(existingENS);
        field.onChange(existingENS.address);
        return;
      }

      const ensAddr = await wallet.getENSInfoByName(ensName);

      if (ensAddr && ensAddr.address) {
        const newEnsInfo: TRecentAddress = {
          address: ensAddr.address,
          name: ensName,
          time: new Date().toISOString(),
        };

        setEnsInfo(newEnsInfo);
        field.onChange(newEnsInfo.address);
      } else {
        setEnsInfo(null);
      }
    } catch (error) {
      console.error('Error resolving ENS:', error);
      setEnsInfo(null);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (isAddress(newValue)) {
      setDisplayLabel(newValue);
      setEnsInfo(null);
    } else if (newValue.endsWith('.eth')) {
      setDisplayLabel('');
      resolveENS(newValue);
    } else {
      setDisplayLabel('');
      setEnsInfo(null);
    }
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const isAddr = isAddress(newValue);

    if (isAddr) {
      setDisplayLabel(newValue);
      field.onChange(newValue);
    } else if (newValue.endsWith('.eth') && ensInfo?.address) {
      field.onChange(ensInfo.address);
    } else {
      setDisplayLabel('');
      field.onChange(newValue);
    }

    setTimeout(() => setIsFocused(false), 200);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleSelectENS = (ens?: TRecentAddress) => {
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

    setIsFocused(false);
  };

  const handleSelectRecentAddress = (item: TRecentAddress) => {
    if (item.name) {
      handleSelectENS(item);
    } else {
      setDisplayLabel(item.address);
      setValue(item.address);
      field.onChange(item.address);
      setIsFocused(false);
    }
  };

  useEffect(() => {
    if (value.endsWith('.eth')) {
      resolveENS(value);
    }
  }, [value]);

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
        {!isFocused && (
          <InputDisplay
            displayLabel={displayLabel}
            ensInfo={ensInfo}
            chainId={chainId}
            onClick={() => inputRef.current?.focus()}
          />
        )}
      </div>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-md rounded-md mt-1 z-10 overflow-hidden max-h-80 overflow-y-auto">
          <ENSSearchResults
            value={value}
            ensInfo={ensInfo}
            loading={loading}
            onSelectENS={() => handleSelectENS()}
          />

          <RecentAddressesList
            recentAddresses={recentAddresses?.filter(
              (item) => item.address !== ensInfo?.address
            )}
            chainId={chainId}
            onSelectAddress={handleSelectRecentAddress}
          />

          {!loading &&
            !ensInfo &&
            !recentAddresses.length &&
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
