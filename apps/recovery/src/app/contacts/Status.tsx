import { ShortedAddress } from '@elytro/ui';
import { useRecoveryRecord } from '@/contexts';
import React from 'react';
import { useAccount } from 'wagmi';
import { CHAIN_LOGOS } from '@/constants/chains';

export default function Status() {
  const { contacts, chainId } = useRecoveryRecord();
  const { address, isConnected, chainId: connectedChainId } = useAccount();

  // Determine connection status and return specific message
  const getConnectionStatus = (contact: { address: string; confirmed: boolean }) => {
    // Don't show anything if no account is connected at all
    if (!isConnected || !address) return null;

    // Check if wrong account is connected (connected account is not this contact)
    const isWrongAccount = address.toLowerCase() !== contact.address.toLowerCase();

    // Check if wrong chain is connected (ensure both are numbers for comparison)
    const isWrongChain = Number(connectedChainId) !== Number(chainId);

    if (isWrongAccount && isWrongChain) {
      return 'Not connected (wrong wallet)';
    } else if (isWrongAccount) {
      return 'Not connected (wrong wallet)';
    } else if (isWrongChain) {
      return 'Not connected (wrong network)';
    }

    return null; // Connected correctly
  };

  return (
    <div className="flex flex-col w-full gap-y-md ">
      {contacts
        ?.filter((contact) => !contact.confirmed)
        .map((contact) => (
          <ShortedAddress
            size="lg"
            className="!p-lg rounded-[16px] w-full bg-gray-50"
            key={contact.address}
            address={contact.address}
            chainIconUrl={chainId ? CHAIN_LOGOS[chainId] : undefined}
            rightExtra={
              contact.confirmed ? (
                <div className="flex items-center text-tiny rounded-xs bg-green-300 px-xs py-3xs">Confirmed</div>
              ) : getConnectionStatus(contact) ? (
                <div className="flex items-center text-tiny rounded-xs bg-red-150 text-red-750 px-xs py-3xs">
                  {getConnectionStatus(contact)}
                </div>
              ) : null
            }
          />
        ))}
    </div>
  );
}
