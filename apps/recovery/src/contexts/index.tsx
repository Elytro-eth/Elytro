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
import React, { createContext, useContext, useState, ReactNode, useEffect, Suspense } from 'react';
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
  error: boolean;
  setStatus: (status: RecoveryStatusEn) => void;
  backToHome: () => void;
  updateContactsSignStatus: (contactAddresses?: Address[], _threshold?: number) => void;
  updateRecoveryStatus: () => void;
  generateStartRecoveryTxData: () => SafeAny;
  generateExecuteRecoveryTxData: () => SafeAny;
}

const RecoveryRecordContext = createContext<IRecoveryRecordContext | undefined>(undefined);

const RecoveryRecordProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const params = useSearchParams();
  const recoveryRecordId = params.get('id');
  const address = params.get('address') as Address;
  const chainId = Number(params.get('chainId'));
  const hash = params.get('hash') as `0x${string}`;
  const from = params.get('from');
  const newOwner = params.get('owner');

  const [contacts, setContacts] = useState<TContact[] | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [status, setStatus] = useState<RecoveryStatusEn>(RecoveryStatusEn.WAITING_FOR_SIGNATURE);
  const [validTime, setValidTime] = useState<number | null>(null);

  const generateStartRecoveryTxData = () => {
    if (!address || !newOwner || !contacts || !threshold) {
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
      return;
    }

    return getRecoveryStartTxData(address, [newOwner as Address], contacts, threshold);
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
      setError(false);
      const res = await queryRecoveryContacts(address as Address, chainId);
      if (res) {
        await updateContactsSignStatus(res.contacts, res.threshold);
      } else {
        throw new Error('No contacts found');
      }
    } catch (error) {
      console.error(error);
      setError(true);
      toast({
        title: 'Get Recovery Record Failed',
        description: (error as Error)?.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRecoveryStatus = async () => {
    if (status === RecoveryStatusEn.RECOVERY_COMPLETED) {
      return;
    }

    if (!address || !chainId || !recoveryRecordId) {
      setError(true);
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
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
    if (status === RecoveryStatusEn.RECOVERY_COMPLETED) {
      return;
    }

    if (address && isAddress(address) && Number(chainId)) {
      getRecoveryContacts();
    } else {
      setError(true);
      toast({
        title: 'Invalid Recovery Record',
        description: 'Please check the url',
        variant: 'destructive',
      });
    }
  }, [address, chainId, status]);

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
        loading,
        contacts,
        address,
        chainId,
        threshold,
        status,
        validTime,
        hash,
        error,
        setStatus,
        backToHome,
        updateContactsSignStatus,
        updateRecoveryStatus,
        generateStartRecoveryTxData,
        generateExecuteRecoveryTxData,
      }}
    >
      {children}
    </RecoveryRecordContext.Provider>
  );
};

export const RecoveryRecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecoveryRecordProviderInner>{children}</RecoveryRecordProviderInner>
    </Suspense>
  );
};

export const useRecoveryRecord = () => {
  const context = useContext(RecoveryRecordContext);
  if (context === undefined) {
    throw new Error('useRecoveryRecord must be used within a RecoveryRecordProvider');
  }
  return context;
};
