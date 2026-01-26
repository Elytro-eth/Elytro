import { Input } from '@/components/ui/input';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FieldValues, useFormContext } from 'react-hook-form';
import { isAddress } from 'viem';
import { useWallet } from '@/contexts/wallet';
import { debounce } from 'lodash';
import ENSSearchResults from './EnsSearch';
import RecentAddressesList from './RecentAddress';
import InputDisplay from './InputDisplay';
import { getRecentAddresses } from '@/utils/recentAddresses';
import { parseEIP3770Address } from '@/utils/format';
import { getChainNameByChainId } from '@/constants/chains';
import { useFormField } from '@/components/ui/form';

interface IAddressInputProps {
  field: FieldValues;
  chainId: number;
}

const AddressInput = ({ field, chainId }: IAddressInputProps) => {
  const { wallet } = useWallet();
  const form = useFormContext();
  const { name } = useFormField();
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [ensInfo, setEnsInfo] = useState<TRecentAddress | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [recentAddresses, setRecentAddresses] = useState<TRecentAddress[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setDropdownPosition(null);
      return;
    }

    getRecentAddresses().then((addresses) => {
      if (addresses) {
        setRecentAddresses(Object.values(addresses));
      }
    });

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
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
        inputRef.current?.blur();
        return;
      }

      const ensAddr = await wallet.getENSInfoByName(ensName);

      if (ensAddr && ensAddr.address) {
        const newEnsInfo: TRecentAddress = {
          address: ensAddr.address,
          name: ensName,
          time: new Date().getTime(),
        };

        setEnsInfo(newEnsInfo);
        field.onChange(newEnsInfo.address);
        inputRef.current?.blur();
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

    const eip3770Parsed = parseEIP3770Address(newValue);
    if (eip3770Parsed) {
      if (!eip3770Parsed.prefixExists) {
        const errorMsg = `Chain prefix "${eip3770Parsed.prefix}" is not supported`;
        setErrorMessage(errorMsg);
        form.setError(name, { message: errorMsg });
        setDisplayLabel('');
        setEnsInfo(null);
        return;
      }

      if (!eip3770Parsed.addressValid) {
        const errorMsg = 'Invalid address format';
        setErrorMessage(errorMsg);
        form.setError(name, { message: errorMsg });
        setDisplayLabel('');
        setEnsInfo(null);
        return;
      }

      if (eip3770Parsed.chainId !== null && eip3770Parsed.chainId !== chainId) {
        const inputChainName = getChainNameByChainId(eip3770Parsed.chainId) || `Chain ${eip3770Parsed.chainId}`;
        const currentChainName = getChainNameByChainId(chainId) || `Chain ${chainId}`;
        const errorMsg = `Address is for ${inputChainName}, but current chain is ${currentChainName}`;
        setErrorMessage(errorMsg);
        form.setError(name, { message: errorMsg });
        setDisplayLabel('');
        setEnsInfo(null);
        return;
      }

      setErrorMessage('');
      form.clearErrors(name);
      setDisplayLabel(eip3770Parsed.address);
      setEnsInfo(null);
      field.onChange(eip3770Parsed.address);
      inputRef.current?.blur();
      return;
    }

    // Not EIP-3770 format, clear error
    setErrorMessage('');
    form.clearErrors(name);

    if (isAddress(newValue)) {
      setDisplayLabel(newValue);
      setEnsInfo(null);
      field.onChange(newValue);
      inputRef.current?.blur();
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

    const eip3770Parsed = parseEIP3770Address(newValue);
    if (eip3770Parsed) {
      if (eip3770Parsed.prefixExists && eip3770Parsed.addressValid && eip3770Parsed.chainId === chainId) {
        setDisplayLabel(eip3770Parsed.address);
        field.onChange(eip3770Parsed.address);
      }
      setIsClosing(true);
      setTimeout(() => {
        setIsFocused(false);
        setIsClosing(false);
      }, 150);
      return;
    }

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

    setIsClosing(true);
    setTimeout(() => {
      setIsFocused(false);
      setIsClosing(false);
    }, 150); // Match animation duration
  };

  const handleFocus = () => {
    setIsClosing(false);
    setIsFocused(true);
    setErrorMessage('');
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

    // Trigger close animation
    setIsClosing(true);
    setTimeout(() => {
      setIsFocused(false);
      setIsClosing(false);
    }, 150);
  };

  const handleSelectRecentAddress = (item: TRecentAddress) => {
    if (item.name) {
      handleSelectENS(item);
    } else {
      setDisplayLabel(item.address);
      setValue(item.address);
      field.onChange(item.address);

      // Trigger close animation
      setIsClosing(true);
      setTimeout(() => {
        setIsFocused(false);
        setIsClosing(false);
      }, 150);
    }
  };

  useEffect(() => {
    if (value.endsWith('.eth')) {
      resolveENS(value);
    }
  }, [value]);

  return (
    <div ref={containerRef} className="bg-white rounded-md flex flex-col relative -mx-4">
      <div className="flex items-center relative px-4">
        <Input
          ref={inputRef}
          className="text-lg border-none bg-white focus-visible:outline-0 pl-0 py-2"
          placeholder={!isFocused && !(displayLabel || ensInfo) ? 'Recipient address / ENS' : ''}
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

      {isFocused &&
        dropdownPosition &&
        createPortal(
          <div
            className={`fixed shadow-md rounded-md z-[100] overflow-hidden max-h-80 overflow-y-auto bg-gray-50 ${
              isClosing ? 'animate-out fade-out-0 slide-out-to-top-2' : 'animate-in fade-in-0 slide-in-from-top-2'
            }`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <ENSSearchResults value={value} ensInfo={ensInfo} loading={loading} onSelectENS={() => handleSelectENS()} />

            <RecentAddressesList
              recentAddresses={recentAddresses?.filter((item) => item.address !== ensInfo?.address)}
              chainId={chainId}
              onSelectAddress={handleSelectRecentAddress}
            />

            {errorMessage && <div className="p-4 text-red-500 text-sm border-t border-gray-200">{errorMessage}</div>}

            {!loading && !ensInfo && !recentAddresses.length && !value.endsWith('.eth') && !errorMessage && (
              <div className="p-4 text-gray-500">Enter an address or ENS name.</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default AddressInput;
