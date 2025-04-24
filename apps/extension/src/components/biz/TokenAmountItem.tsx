import { useAccount } from '@/contexts/account-context';
import { formatDollarBalance, formatTokenAmount } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { TokenInfo } from '@elytro/decoder';
import { useMemo } from 'react';
import DefaultTokenIcon from '@/assets/icons/ether.svg';

interface ITokenAmountItemProps
  extends Partial<Pick<TokenInfo, 'logoURI' | 'symbol' | 'decimals'>> {
  value?: string;
  className?: string;
  size?: 'sm' | 'md';
  showPrice?: boolean;
}

export default function TokenAmountItem({
  logoURI,
  symbol,
  decimals,
  value,
  className,
  size = 'md',
  showPrice = false,
}: ITokenAmountItemProps) {
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();
  if (!value) return '--';

  const [tokenAmount, displayPrice] = useMemo(() => {
    const tokenAmount = formatTokenAmount(String(value), decimals);
    const displayPrice = showPrice
      ? formatDollarBalance(tokenPrices, {
          symbol,
          balance: Number(tokenAmount),
        })
      : null;

    return [tokenAmount, displayPrice];
  }, [value, decimals, symbol, tokenPrices, showPrice]);

  return (
    <span
      className={cn(
        'flex items-center gap-x-sm elytro-text-bold-body',
        size === 'sm' && 'elytro-text-small-bold',
        className
      )}
    >
      <img
        className={cn(
          'size-8 rounded-full ring-1 ring-gray-150 bg-white p-1',
          size === 'sm' && 'size-4'
        )}
        src={logoURI || DefaultTokenIcon}
        alt={symbol}
      />
      <span>
        {tokenAmount} {symbol}
      </span>
      {displayPrice && <span className=" text-gray-600">({displayPrice})</span>}
    </span>
  );
}
