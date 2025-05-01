import AddressWithChain from '@/components/AddressWithChain';
import { useRecoveryRecord } from '@/contexts';
import { isContactSigned } from '@/lib/contact';
import React from 'react';

export default function Status() {
  const { recoveryRecord } = useRecoveryRecord();
  return (
    <div className="flex flex-col w-full gap-y-md ">
      {recoveryRecord?.guardianInfo?.guardians?.map((guardian) => (
        <AddressWithChain
          className="border !p-lg border-gray-300 rounded-[16px]"
          key={guardian}
          address={guardian}
          chainID={Number(recoveryRecord?.chainID)}
          rightExtra={
            isContactSigned(recoveryRecord?.guardianSignatures, guardian) ? (
              <div className="flex items-center text-tiny rounded-xs bg-light-green px-xs py-3xs">Signed</div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
