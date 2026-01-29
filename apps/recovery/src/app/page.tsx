'use client';

import { useRecoveryRecord } from '@/contexts';
import { LoaderCircle } from 'lucide-react';
import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@elytro/ui';
import React from 'react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { RecoveryStatusEn } from '@/constants/enums';
import { InvalidRecordView } from '@/components/InvalidRecordView';
import { SidebarStepper } from '@/components/SidebarStepper';
import Image from 'next/image';
import { shieldImage, doorImage } from '@elytro/ui/assets';

export default function Home() {
  const { status, loading, address, chainId, error } = useRecoveryRecord();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateWithQuery = (href: string) => {
    const query = searchParams.toString();
    const url = query ? `${href}?${query}` : href;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const getCurrentStep = () => {
    if (error) return 1; // Invalid URL
    if (status === RecoveryStatusEn.WAITING_FOR_SIGNATURE) return 2; // Collect confirmations
    if (
      [
        RecoveryStatusEn.SIGNATURE_COMPLETED,
        RecoveryStatusEn.RECOVERY_STARTED,
        RecoveryStatusEn.RECOVERY_READY,
        RecoveryStatusEn.RECOVERY_COMPLETED,
      ].includes(status!)
    )
      return 3; // Recover wallet to Recovery successful
    return 1; // Default to Step 1
  };

  const isConfirmStep = status === RecoveryStatusEn.WAITING_FOR_SIGNATURE;
  const isRecoverStep = [
    RecoveryStatusEn.SIGNATURE_COMPLETED,
    RecoveryStatusEn.RECOVERY_STARTED,
    RecoveryStatusEn.RECOVERY_READY,
  ].includes(status!);

  if (loading) {
    return (
      <div className="my-auto flex flex-col items-center justify-center gap-y-lg">
        <div className="bg-blue-600 rounded-pill p-md">
          <LoaderCircle className="size-12 animate-spin" stroke="#fff" strokeOpacity={0.9} />
        </div>
        <div className="text-bold-body">Fetching...</div>
        <div className="text-tiny text-gray-600">It may take a while for us to gather everything from the chain</div>
      </div>
    );
  }

  if (status === RecoveryStatusEn.RECOVERY_COMPLETED) {
    redirect('/finished');
  }

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="relative">
        <div className="absolute right-full mr-8 top-0 bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper
            currentStep={getCurrentStep()}
            address={address ?? undefined}
            chainId={chainId ?? undefined}
          />
        </div>
        {error ? (
          <InvalidRecordView />
        ) : isConfirmStep ? (
          <ContentWrapper title={<div className="text-center">Confirm Recovery</div>}>
            <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-10 mt-6">
              <Image src={shieldImage} alt="shield" width={164} height={164} />
              <p className="text-smaller text-gray-600">Only recovery contacts can confirm recovery</p>
              <Button onClick={() => navigateWithQuery('/contacts')}>Get started</Button>
            </div>
          </ContentWrapper>
        ) : isRecoverStep ? (
          <ContentWrapper title={<div className="text-center">Recover your account</div>}>
            <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-10 mt-6">
              <Image src={doorImage} alt="door" width={164} height={164} />
              <p className="text-smaller text-gray-600">Account owner or helpers can start recovery</p>
              <Button onClick={() => navigateWithQuery('/start')}>Get started</Button>
            </div>
          </ContentWrapper>
        ) : (
          <InvalidRecordView />
        )}
      </div>
    </div>
  );
}
