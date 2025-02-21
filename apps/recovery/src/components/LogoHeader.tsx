'use client';

import { useRecoveryRecord } from '@/contexts';
import Image from 'next/image';

export function LogoHeader() {
  const { backToHome } = useRecoveryRecord();

  return (
    <div
      onClick={backToHome}
      className="flex flex-row items-center gap-1 cursor-pointer"
    >
      <Image
        className="dark:invert"
        src="/logo.svg"
        alt="Elytro"
        width={20}
        height={20}
        priority
      />
      <span className="text-title">Elytro</span>
    </div>
  );
}
