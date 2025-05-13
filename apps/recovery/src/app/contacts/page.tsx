'use client';

import ContentWrapper from '@/components/ContentWrapper';
import { useRecoveryRecord } from '@/contexts';
import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import Sign from './Sign';
import Status from './Status';
import { isConnectedAccountAContact } from '@/lib/contact';
export default function Contacts() {
  const { recoveryRecord } = useRecoveryRecord();
  const { address } = useAccount();

  const { subtitle, content } = useMemo(() => {
    const isGuardian = address && isConnectedAccountAContact(address, recoveryRecord?.guardianInfo?.guardians);
    if (isGuardian) {
      return {
        subtitle: 'Please sign the recovery',
        content: <Sign />,
      };
    }

    return {
      subtitle: address
        ? 'The connected wallet is not a recovery contact. Please switch to a recovery contact wallet.'
        : 'Please connect a wallet that matches one of the recovery contacts below.',
      content: <Status />,
    };
  }, [address, recoveryRecord]);

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
