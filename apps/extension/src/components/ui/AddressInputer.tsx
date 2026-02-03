import { getIconByChainId, getChainNameByChainId } from '@/constants/chains';
import { Input } from '@elytro/ui';
import { useState, useRef, useEffect } from 'react';
import { isAddress } from 'viem';
import ShortedAddress from '@/components/ui/ShortedAddress';

interface IAddressInputWithChainIconProps {
  chainId: number;
  address: string;
  onChange: (address: string) => void;
}

export default function AddressInputWithChainIcon({ chainId, address, onChange }: IAddressInputWithChainIconProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [displayAddress, setDisplayAddress] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize displayAddress when address is valid on mount or when address changes externally
  useEffect(() => {
    if (isAddress(address) && !isFocused) {
      setDisplayAddress(address);
    } else if (!isAddress(address)) {
      setDisplayAddress('');
    }
  }, [address, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (isAddress(newValue)) {
      setDisplayAddress(newValue);
      inputRef.current?.blur();
    } else {
      setDisplayAddress('');
    }
  };

  const handleBlur = () => {
    if (isAddress(address)) {
      setDisplayAddress(address);
    } else {
      setDisplayAddress('');
    }
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayAddress('');
  };

  const isValidAddress = isAddress(address);
  const showShortedAddress = !isFocused && isValidAddress && (displayAddress || address);
  const chainName = getChainNameByChainId(chainId);

  return (
    <>
      <style>{`
        .address-input-wrapper input:focus,
        .address-input-wrapper input:focus-visible {
          outline: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
        }
      `}</style>
      <div className="w-full relative bg-gray-50 rounded-md px-lg py-0 address-input-wrapper">
        {/* Chain info at top */}
        <div className="flex flex-row items-center gap-x-2xs mb-md pt-md">
          <img src={getIconByChainId(chainId)} alt="chain" className="size-4 rounded-full" />
          <span className="text-sm text-gray-750">{chainName}</span>
        </div>

        {/* Address input/display */}
        <div className="h-[2.5rem] flex items-center pb-md">
          {showShortedAddress ? (
            <div
              className="w-full cursor-pointer flex items-center"
              onClick={() => {
                setIsFocused(true);
                inputRef.current?.focus();
              }}
            >
              <ShortedAddress
                address={displayAddress || address}
                chainId={chainId}
                size="lg"
                showChainIcon={false}
                className="!bg-transparent !p-0"
              />
            </div>
          ) : (
            <Input
              ref={inputRef}
              placeholder="Address"
              value={address}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className="!bg-transparent !px-0 !border-none !py-0 rounded-none"
            />
          )}
        </div>
      </div>
    </>
  );
}
