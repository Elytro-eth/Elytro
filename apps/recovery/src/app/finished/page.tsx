import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import DoorImg from '@/assets/door.png';
import Image from 'next/image';
import { SidebarStepper } from '@/components/SidebarStepper';

export default function Finished() {
  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-row gap-8 items-start">
        <div className="bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper />
        </div>
        <ContentWrapper title={<div className="text-center">Recovery successful</div>}>
          <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20 mt-10">
            <Image src={DoorImg} alt="door" width={164} height={164} />
            <p className="text-smaller text-gray-600">Open Elytro extension to access wallet</p>
          </div>
        </ContentWrapper>
      </div>
    </div>
  );
}
