'use client';

import { CHAIN_LOGOS, SUPPORTED_CHAINS } from '@/constants/chains';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';
import { Address } from 'viem';

interface IProps {
  address?: Address;
  chainID?: number;
  className?: string;
  rightExtra?: React.ReactNode;
  hideTooltip?: boolean;
}

export default function AddressWithChain({ address, chainID = 0, className, rightExtra, hideTooltip = false }: IProps) {
  const isSupportedChain = SUPPORTED_CHAINS.some((chain) => chain.id === chainID);

  return (
    <div
      className={cn('flex items-center justify-between py-sm px-md rounded-sm bg-gray-50 fix:bg-gray-150', className)}
    >
      <div className="flex items-center gap-2">
        {isSupportedChain && (
          <Image
            src={CHAIN_LOGOS[chainID]}
            alt={!Number.isNaN(chainID) ? chainID.toString() : ''}
            width={20}
            height={20}
            className="rounded-full size-6"
          />
        )}
        {address ? (
          <div className={hideTooltip ? '' : 'relative group'}>
            <div className="text-smaller flex items-center gap-2 cursor-pointer">
              {address?.slice(0, 7)}
              <span className="text-gray-600 bg-gray-300 rounded-xs px-1">...</span>
              {address?.slice(-5)}
            </div>
            {/* CSS-only tooltip - only show if hideTooltip is false */}
            {!hideTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 ml-1.5 mb-2 px-3 py-2 bg-blue-600 text-blue-450 text-sm rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                <span className="font-bold text-blue-300">{address?.slice(0, 7)}</span>
                {address?.slice(7, -5)}
                <span className="font-bold text-blue-300">{address?.slice(-5)}</span>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-750"></div>
              </div>
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
