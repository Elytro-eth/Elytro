'use client';

import { RecoveryStatusEn } from '@/constants/enums';
import { toast } from '@/hooks/use-toast';
import {
  checkIsContactSigned,
  getExecuteRecoveryTxData,
  getOperationState,
  getRecoveryStartTxData,
  queryRecoveryContacts,
} from '@/requests/contract';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Address, isAddress } from 'viem';

interface IRecoveryRecordContext {
  loading: boolean;
  contacts: TContact[] | null;
  address: Address | null;
  chainId: number | null;
  threshold: number | null;
  status: RecoveryStatusEn | null;
  validTime: number | null;
  hash: `0x${string}` | null;
  setStatus: (status: RecoveryStatusEn) => void;
  backToHome: () => void;
  updateContactsSignStatus: (contactAddresses?: Address[], _threshold?: number) => void;
  generateStartRecoveryTxData: () => SafeAny;
  generateExecuteRecoveryTxData: () => SafeAny;
}

const RecoveryRecordContext = createContext<IRecoveryRecordContext | undefined>(undefined);

// /?id=0x16c8d383580cf86db99e2ec27e5adc06b4e558a5de12fd649a06e112e15146be
// &address=0x9261229B5a58891B7cCe9744cF94D5b6869946a5
// &chainId=11155111
// &approveHash=0x4deb94be66fb4a041f05a0d9116b68de53bfdc34c0c2277269f898234c32f4a2
// &from=8405819
// &owner=0xf937057d2cf299D60e2066740f5508B78a3048eb
export const RecoveryRecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const recoveryRecordId = params.get('id');
  const address = params.get('address') as Address;
  const chainId = Number(params.get('chainId'));
  const hash = params.get('approveHash') as `0x${string}`;
  const from = params.get('from');
  const newOwner = params.get('owner');

  const saltRef = useRef<string | null>(null);

  const [contacts, setContacts] = useState<TContact[] | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [status, setStatus] = useState<RecoveryStatusEn>(RecoveryStatusEn.WAITING_FOR_SIGNATURE);
  const [validTime, setValidTime] = useState<number | null>(null);

  const generateStartRecoveryTxData = () => {
    if (!address || !newOwner || !contacts || !threshold || !saltRef.current) {
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
      return;
    }

    return getRecoveryStartTxData(address, [newOwner as Address], {
      contacts,
      threshold,
      salt: saltRef.current,
    });
  };

  const generateExecuteRecoveryTxData = () => {
    if (!address || !newOwner) {
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
      return;
    }

    return getExecuteRecoveryTxData(address, [newOwner as Address]);
  };

  const getRecoveryContacts = async () => {
    try {
      setLoading(true);
      const res = await queryRecoveryContacts(address as Address, chainId);
      if (res) {
        saltRef.current = res.salt;
        await updateContactsSignStatus(res.contacts, res.threshold);
      } else {
        throw new Error('No contacts found');
      }
    } catch (error) {
      toast({
        title: 'Get Recovery Record Failed',
        description: (error as Error)?.message || 'Please try again later',
        variant: 'destructive',
      });
      saltRef.current = null;
      router.replace('/not-found');
    } finally {
      setLoading(false);
    }
  };

  const updateRecoveryStatus = async () => {
    if (!address || !chainId || !recoveryRecordId) {
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
      router.replace('/not-found');
      return;
    }

    if (status === RecoveryStatusEn.WAITING_FOR_SIGNATURE) {
      return;
    }

    const res = await getOperationState(address as Address, chainId, recoveryRecordId as `0x${string}`);
    setStatus(res.status);
    setValidTime(res.validTime);
  };

  useEffect(() => {
    updateRecoveryStatus();
  }, [status, address, chainId, recoveryRecordId]);

  const updateContactsSignStatus = async (contactAddresses?: Address[], _threshold?: number) => {
    contactAddresses = contactAddresses || contacts?.map((contact) => contact.address);
    _threshold = _threshold || threshold || 0;

    if (!contactAddresses || !_threshold) {
      return;
    }

    const formattedContacts = await Promise.all(
      contactAddresses.map(async (address) => {
        const isPrevSigned = contacts?.find((contact) => contact.address === address)?.confirmed;
        const confirmed = isPrevSigned
          ? true
          : await checkIsContactSigned({
              hash: hash as `0x${string}`,
              guardian: address as Address,
              fromBlock: BigInt(from || '0'),
              chainId: Number(chainId),
            });
        return {
          address,
          confirmed,
        };
      })
    );

    const signedCount = formattedContacts.filter((contact) => contact.confirmed).length;
    const isSignatureCompleted = signedCount >= _threshold;

    setContacts(formattedContacts);
    setThreshold(_threshold);
    setStatus((prev) =>
      prev === RecoveryStatusEn.WAITING_FOR_SIGNATURE && isSignatureCompleted
        ? RecoveryStatusEn.SIGNATURE_COMPLETED
        : prev
    );
  };

  useEffect(() => {
    if (address && isAddress(address) && Number(chainId) && hash) {
      getRecoveryContacts();
    } else {
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
      router.replace('/not-found');
    }
  }, [address, chainId]);

  const backToHome = () => {
    router.replace(`/?${params.toString()}`);
  };

  useEffect(() => {
    if (status === RecoveryStatusEn.WAITING_FOR_SIGNATURE && contacts?.length && threshold) {
      const interval = setInterval(async () => {
        await updateContactsSignStatus(
          contacts.map((contact) => contact.address),
          threshold
        );
      }, 5_000);
      return () => clearInterval(interval);
    }
  }, [status, contacts, threshold]);

  return (
    <RecoveryRecordContext.Provider
      value={{
        contacts,
        loading,
        updateContactsSignStatus,
        backToHome,
        threshold,
        status,
        validTime,
        setStatus,
        address,
        chainId,
        hash,
        generateStartRecoveryTxData,
        generateExecuteRecoveryTxData,
      }}
    >
      {children}
    </RecoveryRecordContext.Provider>
  );
};

export const useRecoveryRecord = () => {
  const context = useContext(RecoveryRecordContext);
  if (context === undefined) {
    throw new Error('useRecoveryRecord must be used within a RecoveryRecordProvider');
  }
  return context;
};
