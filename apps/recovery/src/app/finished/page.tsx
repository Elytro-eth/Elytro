'use client';

import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import { bgWalletLg } from '@elytro/ui/assets';
import Image from 'next/image';
import { SidebarStepper } from '@/components/SidebarStepper';
import { useRecoveryRecord } from '@/contexts';

export default function Finished() {
  const { address, chainId } = useRecoveryRecord();

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="relative">
        <div className="absolute right-full mr-8 top-0 bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper currentStep={4} address={address ?? undefined} chainId={chainId ?? undefined} />
        </div>
        <ContentWrapper>
          <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20 mt-10">
            <Image src={bgWalletLg} alt="door" width={164} height={164} />
            <h1 className="text-title text-center">Recovery successful</h1>
            <p className="text-smaller text-gray-600">Open Elytro extension to access wallet</p>
          </div>
        </ContentWrapper>
      </div>
    </div>
  );
}
