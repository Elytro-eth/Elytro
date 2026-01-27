import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SUPPORTED_CHAINS } from '@/constants/chains';
import { cn } from '@/utils/shadcn/utils';
import { ReactNode } from 'react';
import { isAddress } from 'viem';

interface IProps {
  address?: string;
  chainId?: number;
  className?: string;
  size?: keyof typeof SIZE_MAP;
  dotColor?: string;
  showChainIcon?: boolean;
  extra?: ReactNode;
  extraLayout?: 'row' | 'column';
  iconSize?: string;
}

const SIZE_MAP = {
  xs: {
    icon: 'size-4 rounded-full',
    text: 'elytro-text-tiny-body',
  },
  sm: {
    icon: 'size-4 rounded-full',
    text: 'elytro-text-smaller-body',
  },
  md: {
    icon: 'size-6 rounded-full',
    text: 'elytro-text-bold-body',
  },
  lg: {
    icon: 'size-6 rounded-full',
    text: 'text-lg font-bold',
  },
};

export default function FragmentedAddress({
  address,
  chainId,
  size = 'sm',
  className,
  dotColor,
  showChainIcon = true,
  extra,
  extraLayout = 'column',
  iconSize,
}: IProps) {
  if (!address || !isAddress(address)) {
    return '--';
  }

  const prefix = address.slice(0, 7);
  const suffix = address.slice(-5);
  const { icon, text } = SIZE_MAP[size];
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
  const iconClassName = iconSize ? `${iconSize} rounded-full` : icon;

  return (
    <div className={cn('flex items-center gap-xs', className)}>
      {showChainIcon && chain && <img src={chain.icon} alt={chain.name} className={iconClassName} />}
      <div className={cn('flex', extraLayout === 'row' ? 'flex-row items-center' : 'flex-col')}>
        <div className={cn('flex items-center gap-0.5', text)}>
          <span className={size === 'xs' ? 'text-gray-600' : undefined}>{prefix}</span>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <span className="py-0 px-[6px] bg-gray-150 rounded-full" style={{ backgroundColor: dotColor }}>
                ···
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-blue-600 p-4">
              <div className="text-blue-450">
                <span className="text-blue-300 font-bold">{prefix}</span>
                {address.slice(7, -5)}
                <span className="text-blue-300 font-bold">{suffix}</span>
              </div>
            </TooltipContent>
          </Tooltip>
          <span className={size === 'xs' ? 'text-gray-600' : undefined}>{suffix}</span>
        </div>
        {extra && <div className={cn(extraLayout === 'row' ? 'ml-sm' : 'mt-0')}>{extra}</div>}
      </div>
    </div>
  );
}
