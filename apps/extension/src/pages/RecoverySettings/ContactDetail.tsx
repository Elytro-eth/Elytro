import AddressInputWithChainIcon from '@/components/ui/AddressInputer';
import { Button } from '@/components/ui/button';
import HelperText from '@/components/ui/HelperText';
import { useAccount } from '@/contexts/account-context';
import { CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { isAddress } from 'viem';

interface IContactDetailProps {
  onAddContact: (contact: TRecoveryContact) => void;
}

export default function ContactDetail({ onAddContact }: IContactDetailProps) {
  const { currentAccount: currentAccount } = useAccount();
  const [address, setAddress] = useState<string>('');
  const [isAddressValid, setIsAddressValid] = useState<boolean>(true);

  const handleAddressChange = (address: string) => {
    setAddress(address);
    setIsAddressValid(isAddress(address));
  };

  return (
    <div className="flex flex-col justify-between ">
      <div className=" flex flex-col gap-y-md">
        <h1 className="elytro-text-bold-body my-1">Add a recovery contact</h1>

        <AddressInputWithChainIcon chainId={currentAccount.chainId} address={address} onChange={handleAddressChange} />

        {!isAddressValid && (
          <div className="flex items-center gap-x-2xs">
            <CircleAlert className="size-3  stroke-red" />
            <p className="elytro-text-tiny-body text-red">Recovery requires Ethereum-compatible addresses</p>
          </div>
        )}

        <HelperText description="Addresses will be visible on chain" />
      </div>

      <Button className="mt-4" disabled={!isAddress(address)} onClick={() => onAddContact({ address })}>
        Save contact
      </Button>
    </div>
  );
}
