import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import DoorImg from '@/assets/door.png';
import Image from 'next/image';

export default function Finished() {
  return (
    <ContentWrapper title="Recovery successful">
      <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20">
        <Image src={DoorImg} alt="door" width={164} height={164} />
        <p className="text-smaller text-gray-600">Open Elytro extension to access wallet</p>
      </div>
    </ContentWrapper>
  );
}
