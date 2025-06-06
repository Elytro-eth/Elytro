import AddressWithChain from '@/components/AddressWithChain';
import { useRecoveryRecord } from '@/contexts';
import React from 'react';

export default function Status() {
  const { contacts, chainId } = useRecoveryRecord();

  return (
    <div className="flex flex-col w-full gap-y-md ">
      {contacts?.map((contact) => (
        <AddressWithChain
          className="border !p-lg border-gray-300 rounded-[16px]"
          key={contact.address}
          address={contact.address}
          chainID={chainId!}
          rightExtra={
            contact.confirmed ? (
              <div className="flex items-center text-tiny rounded-xs bg-light-green px-xs py-3xs">Confirmed</div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
