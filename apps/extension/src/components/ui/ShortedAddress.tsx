import { getIconByChainId } from '@/constants/chains';
import { formatAddressToShort } from '@/utils/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@elytro/ui';

interface IProps {
  address: string;
  chainId?: number;
  className?: string;
  hideTooltip?: boolean;
}

export default function ShortedAddress({ address, chainId, className, hideTooltip = false }: IProps) {
  const prefix = address.slice(0, 7);
  const suffix = address.slice(-5);

  return (
    <span className={cn('w-fit flex flex-row items-center gap-x-sm p-xs rounded-2xs bg-gray-150', className)}>
      {chainId && <img src={getIconByChainId(chainId)} className="size-4 rounded-full" />}
      {!hideTooltip ? (
        <Tooltip delayDuration={0} disableHoverableContent>
          <TooltipTrigger>
            <span className="elytro-text-tiny-body">{formatAddressToShort(address)}</span>
          </TooltipTrigger>
          <TooltipContent className="rounded-sm bg-blue-600 p-4">
            <div className="text-blue-450">
              <span className="text-blue-300 font-bold">{prefix}</span>
              {address.slice(7, -5)}
              <span className="text-blue-300 font-bold">{suffix}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="elytro-text-tiny-body">{formatAddressToShort(address)}</span>
      )}
    </span>
  );
}
