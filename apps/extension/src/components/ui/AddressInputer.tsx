import { getIconByChainId } from '@/constants/chains';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import { isAddress } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';

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
  const showFragmentedAddress = !isFocused && isValidAddress && (displayAddress || address);

  return (
    <div className="w-full flex flex-row items-center bg-gray-150 rounded-md px-lg py-sm elytro-text-body text-gray-600 relative">
      <img src={getIconByChainId(chainId)} className="rounded-full size-6 flex-shrink-0" />
      <div className="flex-1 relative min-w-0">
        {showFragmentedAddress ? (
          <div
            className="cursor-pointer"
            onClick={() => {
              setIsFocused(true);
              inputRef.current?.focus();
            }}
          >
            <FragmentedAddress
              address={displayAddress || address}
              chainId={chainId}
              size="lg"
              showChainIcon={false}
              className="h-10 ml-3"
            />
          </div>
        ) : (
          <Input
            ref={inputRef}
            className="border-none bg-transparent text-lg outline-0 focus:outline-0 focus-visible:outline-0 focus-visible:bg-transparent w-full text-gray-900"
            placeholder="Enter wallet address"
            value={address}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        )}
      </div>
    </div>
  );
}
