'use client';

import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import Image from 'next/image';
import { SidebarStepper } from '@/components/SidebarStepper';
import { Button } from '@elytro/ui';
import { useRecoveryRecord } from '@/contexts';
import { bgContactsLg } from '@elytro/ui/assets';
import { RecoveryStatusEn } from '@/constants/enums';

export default function Confirmed() {
  let backToHome;
  let address: string | undefined;
  let chainId: number | undefined;
  let status: RecoveryStatusEn | null = null;

  try {
    const context = useRecoveryRecord();
    backToHome = context?.backToHome;
    address = context?.address ?? undefined;
    chainId = context?.chainId ?? undefined;
    status = context?.status ?? null;
  } catch (error) {
    console.error('Error getting context:', error);
    backToHome = null;
  }

  const hasEnoughConfirmations = status === RecoveryStatusEn.SIGNATURE_COMPLETED;

  const handleBackToHome = () => {
    try {
      if (backToHome && typeof backToHome === 'function') {
        backToHome();
      } else {
        console.warn('backToHome function not available, using fallback');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error navigating back to home:', error);
      // Fallback navigation
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="relative">
        <div className="absolute right-full mr-8 top-0 bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper currentStep={2} address={address} chainId={chainId} />
        </div>
        <ContentWrapper>
          <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20 mt-10">
            <Image src={bgContactsLg} alt="shield" width={164} height={164} />
            <h1 className="text-title text-center">Confirmed successfully</h1>
            <p className="text-smaller text-gray-600">You can disconnect and close the window now</p>
            <Button onClick={handleBackToHome} variant="secondary" className="mt-4">
              {hasEnoughConfirmations ? 'Continue to Start Recovery' : 'Back to Recovery'}
            </Button>
          </div>
        </ContentWrapper>
      </div>
    </div>
  );
}
