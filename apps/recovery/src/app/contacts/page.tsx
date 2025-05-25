'use client';

import ContentWrapper from '@/components/ContentWrapper';
import { useRecoveryRecord } from '@/contexts';
import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import Sign from './Sign';
import Status from './Status';
import { isConnectedAccountAContact } from '@/lib/contact';
export default function Contacts() {
  const { contacts, loading } = useRecoveryRecord();
  const { address } = useAccount();

  const { subtitle, content } = useMemo(() => {
    if (loading) {
      return {
        subtitle: '',
        content: <div className="mt-lg animate-spin rounded-full size-10 border-y-2 border-primary mx-auto"></div>,
      };
    }
    const isGuardian = address && contacts && isConnectedAccountAContact(address, contacts);

    if (isGuardian) {
      return {
        subtitle: 'Please sign the recovery',
        content: <Sign />,
      };
    }

    return {
      subtitle: address ? (
        <span>
          The connected wallet is <span className="text-red font-bold">NOT</span> a recovery contact. Please switch to a
          recovery contact wallet.
        </span>
      ) : (
        <span>Please connect a wallet that matches one of the recovery contacts below.</span>
      ),
      content: <Status />,
    };
  }, [address, contacts, loading]);

  return (
    <ContentWrapper
      title={<div className="text-left mr-5xl">Sign your friend’s recovery</div>}
      // allSteps={3}
      // currentStep={1}
      subtitle={subtitle}
    >
      {content}
    </ContentWrapper>
  );
}
