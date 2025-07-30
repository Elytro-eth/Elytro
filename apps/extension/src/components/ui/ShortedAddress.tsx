import { getIconByChainId } from '@/constants/chains';
import { formatAddressToShort } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { Tooltip, TooltipContent } from './tooltip';
import { TooltipTrigger } from '@radix-ui/react-tooltip';

interface IProps {
  address: string;
  chainId?: number;
  className?: string;
}

export default function ShortedAddress({ address, chainId, className }: IProps) {
  const prefix = address.slice(0, 7);
  const suffix = address.slice(-5);

  return (
    <span className={cn('w-fit flex flex-row items-center gap-x-sm p-xs rounded-2xs bg-gray-150', className)}>
      {chainId && <img src={getIconByChainId(chainId)} className="size-4 rounded-full" />}
      <Tooltip delayDuration={0} disableHoverableContent>
        <TooltipTrigger>
          <span className="elytro-text-tiny-body">{formatAddressToShort(address)}</span>
        </TooltipTrigger>
        <TooltipContent className="rounded-sm bg-dark-blue p-4">
          <div className="text-blue">
            <span className="text-light-blue font-bold">{prefix}</span>
            {address.slice(7, -5)}
            <span className="text-light-blue font-bold">{suffix}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
