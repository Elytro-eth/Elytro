import ContentWrapper from '@/components/ContentWrapper';
import React from 'react';
import DoorImg from '@/assets/door.png';
import Image from 'next/image';

export default function Finished() {
  return (
    <ContentWrapper title="Recovery Success">
      <div className="flex flex-col items-center justify-center text-center gap-y-xl mx-20">
        <Image src={DoorImg} alt="door" width={164} height={164} />
        <p className="text-smaller text-gray-600">You now have regained access to your wallet </p>
      </div>
    </ContentWrapper>
  );
}
