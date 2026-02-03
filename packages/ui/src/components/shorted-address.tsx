'use client';

import React from 'react';
import { cn } from '../utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export type ShortedAddressSize = 'sm' | 'lg';

const SIZE_CONFIG = {
  sm: {
    icon: 'size-4 rounded-full',
    text: 'elytro-text-tiny-body',
    dotPadding: 'py-0 px-1',
  },
  lg: {
    icon: 'size-6 rounded-full',
    text: 'text-lg font-bold',
    dotPadding: 'py-0 px-[6px]',
  },
};

interface ShortedAddressProps {
  address: string;
  chainIconUrl?: string;
  className?: string;
  size?: ShortedAddressSize;
  hideTooltip?: boolean;
  showChainIcon?: boolean;
  dotColor?: string;
  rightExtra?: React.ReactNode;
  bottomExtra?: React.ReactNode;
}

export function ShortedAddress({
  address,
  chainIconUrl,
  className,
  size = 'sm',
  hideTooltip = false,
  showChainIcon = true,
  dotColor,
  rightExtra,
  bottomExtra,
}: ShortedAddressProps) {
  if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length < 12) {
    return <span>--</span>;
  }

  const prefix = address.slice(0, 7);
  const suffix = address.slice(-5);
  const config = SIZE_CONFIG[size];

  const AddressText = () => (
    <div className={cn('flex items-center gap-0.5', config.text)}>
      <span>{prefix}</span>
      {hideTooltip ? (
        <span
          className={cn('bg-gray-150 rounded-full', config.dotPadding)}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        >
          ···
        </span>
      ) : (
        <Tooltip delayDuration={0} disableHoverableContent>
          <TooltipTrigger>
            <span
              className={cn('bg-gray-150 rounded-full', config.dotPadding)}
              style={dotColor ? { backgroundColor: dotColor } : undefined}
            >
              ···
            </span>
          </TooltipTrigger>
          <TooltipContent className="rounded-sm bg-blue-600 p-4">
            <div className="text-blue-450">
              <span className="text-blue-300 font-bold">{prefix}</span>
              {address.slice(7, -5)}
              <span className="text-blue-300 font-bold">{suffix}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      <span>{suffix}</span>
    </div>
  );

  return (
    <div
      className={cn(
        'flex flex-row items-center p-xs rounded-2xs bg-gray-150',
        rightExtra ? 'w-full justify-between' : 'w-fit',
        className
      )}
    >
      <div className="flex flex-row items-start gap-x-sm flex-shrink-0">
        {showChainIcon && chainIconUrl && (
          <img src={chainIconUrl} alt="chain" className={cn(config.icon, bottomExtra && 'mt-0.5')} />
        )}
        <div className="flex flex-col">
          <AddressText />
          {bottomExtra}
        </div>
      </div>
      {rightExtra && <div className="ml-lg flex-shrink-0">{rightExtra}</div>}
    </div>
  );
}

export default ShortedAddress;
