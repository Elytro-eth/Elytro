'use client';

import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import Image from 'next/image';
import { SidebarStepper } from '@/components/SidebarStepper';
import { Button } from '@/components/ui/button';
import { useRecoveryRecord } from '@/contexts';
import ShieldImg from '@/assets/shield.png';

export default function Confirmed() {
  let backToHome;

  try {
    const context = useRecoveryRecord();
    backToHome = context?.backToHome;
  } catch (error) {
    console.error('Error getting context:', error);
    backToHome = null;
  }

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
      <div className="flex flex-row gap-8 items-start">
        <div className="bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper currentStep={2} />
        </div>
        <ContentWrapper title={<div className="text-center">Confirmed successfully</div>}>
          <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20 mt-10">
            <Image src={ShieldImg} alt="door" width={164} height={164} />
            <p className="text-smaller text-gray-600">You can disconnect and close the window now</p>
            <Button onClick={handleBackToHome} variant="secondary" className="mt-4">
              Back to Recovery
            </Button>
          </div>
        </ContentWrapper>
      </div>
    </div>
  );
}
