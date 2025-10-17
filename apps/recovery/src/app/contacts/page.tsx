'use client';

import ContentWrapper from '@/components/ContentWrapper';
import { useRecoveryRecord } from '@/contexts';
import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import Sign from './Sign';
import Status from './Status';
import { isConnectedAccountAContact } from '@/lib/contact';
import { toast } from '@/hooks/use-toast';
import { SidebarStepper } from '@/components/SidebarStepper';

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
        subtitle: 'Please confirm the recovery',
        content: <Sign />,
      };
    }

    if (address && !isGuardian) {
      toast({
        title: 'Connected wallet is not a recovery wallet',
        variant: 'destructive',
      });
    }
    return {
      subtitle: address ? (
        <span className="text-gray-600">
          {/* The connected wallet is not a recovery contact. Please switch to a recovery contact wallet. */}
          CConnect to a wallet you control from below to confirm recovery.
        </span>
      ) : (
        <span className="text-gray-600">Connect to a wallet you control from below to confirm recovery.</span>
      ),
      content: <Status />,
    };
  }, [address, contacts, loading]);

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-row gap-8 items-start">
        <div className="bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper currentStep={2} />
        </div>
        <ContentWrapper
          title={<div className="text-left mr-5xl">I’m a recovery contact</div>}
          // allSteps={3}
          // currentStep={1}
          subtitle={subtitle}
        >
          {content}
        </ContentWrapper>
      </div>
    </div>
  );
}
