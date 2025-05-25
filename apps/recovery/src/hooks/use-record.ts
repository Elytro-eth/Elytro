import { queryRecoveryContacts } from '@/requests/contract';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';
import { Address } from 'viem';

export const useRecord = () => {
  const params = useSearchParams();
  const address = params.get('address');
  const chainId = params.get('chainId');

  const [contacts, setContacts] = useState<TRecoveryContactsInfo | null>(null);

  useEffect(() => {
    const getRecoveryContacts = async () => {
      const recoveryContacts = await queryRecoveryContacts(address as Address, Number(chainId));
      setContacts(recoveryContacts);
    };

    getRecoveryContacts();
  }, [address, chainId]);

  return {
    contacts,
  };
};
