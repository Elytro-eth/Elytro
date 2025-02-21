'use client';

import { CHAIN_LOGOS } from '@/constants/chains';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React, { useState } from 'react';

interface IProps {
  address?: string;
  chainID?: number;
  className?: string;
  rightExtra?: React.ReactNode;
}

export default function AddressWithChain({
  address,
  chainID = 0,
  className,
  rightExtra,
}: IProps) {
  const [showFullAddress, setShowFullAddress] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center justify-between  py-sm px-md rounded-sm bg-white fix:bg-gray-300',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {chainID && (
          <Image
            src={CHAIN_LOGOS[chainID]}
            alt={!Number.isNaN(chainID) ? chainID.toString() : ''}
            width={20}
            height={20}
            className="rounded-full size-6"
          />
        )}
        {address ? (
          <div
            className="text-smaller flex items-center gap-2 cursor-pointer transition duration-700 ease-in-out"
            title={address}
            onClick={() => setShowFullAddress((prev) => !prev)}
          >
            {showFullAddress ? (
              address
            ) : (
              <>
                {address?.slice(0, 6)}
                <span className="text-gray-500 bg-gray-300 rounded-xs px-1">
                  ...
                </span>
                {address?.slice(-4)}
              </>
            )}
          </div>
        ) : (
          '--'
        )}
      </div>
      {rightExtra}
    </div>
  );
}
