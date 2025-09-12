import AddressWithChain from '@/components/AddressWithChain';
import { useRecoveryRecord } from '@/contexts';
import React from 'react';
import { useAccount } from 'wagmi';

export default function Status() {
  const { contacts, chainId } = useRecoveryRecord();
  const { address, isConnected, chainId: connectedChainId } = useAccount();

  // Determine if we should show "Not connected" badge
  const shouldShowNotConnected = (contact: { address: string; confirmed: boolean }) => {
    // Don't show if no account is connected at all
    if (!isConnected || !address) return false;

    // Show if wrong account is connected (connected account is not this contact)
    const isWrongAccount = address.toLowerCase() !== contact.address.toLowerCase();

    // Show if wrong chain is connected
    const isWrongChain = connectedChainId !== chainId;

    return isWrongAccount || isWrongChain;
  };

  return (
    <div className="flex flex-col w-full gap-y-md ">
      {contacts
        ?.filter((contact) => !contact.confirmed)
        .map((contact) => (
          <AddressWithChain
            className="border !p-lg border-gray-300 rounded-[16px]"
            key={contact.address}
            address={contact.address}
            chainID={chainId!}
            rightExtra={
              contact.confirmed ? (
                <div className="flex items-center text-tiny rounded-xs bg-light-green px-xs py-3xs">Confirmed</div>
              ) : shouldShowNotConnected(contact) ? (
                <div className="flex items-center text-tiny rounded-xs bg-light-red text-red px-xs py-3xs">
                  Not connected
                </div>
              ) : null
            }
          />
        ))}
    </div>
  );
}
