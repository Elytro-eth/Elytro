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
}

const SIZE_MAP = {
  sm: {
    icon: 'size-4 rounded-full',
    text: 'elytro-text-smaller-body',
  },
  md: {
    icon: 'size-6 rounded-full',
    text: 'elytro-text-bold-body',
  },
  lg: {
    icon: 'size-8 rounded-full',
    text: 'elytro-text-bold-body',
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
}: IProps) {
  if (!address || !isAddress(address)) {
    return '--';
  }

  const prefix = address.slice(0, 6);
  const suffix = address.slice(-6);
  const { icon, text } = SIZE_MAP[size];
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);

  return (
    <div className={cn('flex items-center gap-sm', className)}>
      {showChainIcon && chain && <img src={chain.icon} alt={chain.name} className={icon} />}
      <div className={cn('flex', extraLayout === 'row' ? 'flex-row items-center' : 'flex-col')}>
        <div className={cn('flex items-center gap-sm', text)}>
          <span>{prefix}</span>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <span className="px-1 bg-gray-300 rounded-xs" style={{ backgroundColor: dotColor }}>
                …
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-dark-blue p-4">
              <div className="text-blue">
                <span className="text-light-blue font-bold">{prefix}</span>
                {address.slice(6, -6)}
                <span className="text-light-blue font-bold">{suffix}</span>
              </div>
            </TooltipContent>
          </Tooltip>
          <span>{suffix}</span>
        </div>
        {extra && <div className={cn(extraLayout === 'row' ? 'ml-sm' : 'mt-0')}>{extra}</div>}
      </div>
    </div>
  );
}
