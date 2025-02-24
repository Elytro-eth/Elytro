import { formatTokenAmount } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { TokenInfo } from '@soulwallet/decoder';

interface ITokenAmountItemProps
  extends Partial<Pick<TokenInfo, 'logoURI' | 'symbol' | 'decimals'>> {
  value?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function TokenAmountItem({
  logoURI,
  symbol,
  decimals,
  value,
  className,
  size = 'md',
}: ITokenAmountItemProps) {
  if (!value) return '--';

  return (
    <span
      className={cn(
        'flex items-center gap-x-sm elytro-text-bold-body',
        size === 'sm' && 'elytro-text-small-bold',
        className
      )}
    >
      {/* TODO: no fromInfo. no logo & name */}
      <img
        className={cn(
          'size-6 rounded-full ring-1 ring-gray-150 bg-white',
          size === 'sm' && 'size-4'
        )}
        src={logoURI}
        alt={symbol}
      />
      <span>{formatTokenAmount(value, decimals, symbol)}</span>
    </span>
  );
}
