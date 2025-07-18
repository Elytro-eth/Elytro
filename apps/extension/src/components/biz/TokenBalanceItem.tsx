import { useAccount } from '@/contexts/account-context';
import { formatDollarBalance, formatTokenAmount } from '@/utils/format';
import { useMemo } from 'react';

interface ITokenBalanceItemProps {
  amount: number | string;
  decimals: number;
  symbol: string;
  address: `0x${string}`;
  className?: string;
  showSymbol?: boolean;
}

export default function TokenBalanceItem({
  amount,
  decimals,
  symbol,
  address,
  className,
  showSymbol = true,
}: ITokenBalanceItemProps) {
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();

  const [tokenAmount, displayPrice] = useMemo(() => {
    const tokenAmount = formatTokenAmount(String(amount), decimals);
    const displayPrice = formatDollarBalance(tokenPrices, {
      tokenContractAddress: address,
      symbol,
      balance: Number(tokenAmount),
      maxDecimalLength: 2,
    });

    return [tokenAmount, displayPrice];
  }, [amount, decimals, address, symbol, tokenPrices]);

  return (
    <div className={`flex flex-col  items-end gap-x-sm w-fit whitespace-nowrap ${className}`}>
      <p className="text-base font-bold text-gray-900">{showSymbol ? `${tokenAmount} ${symbol}` : tokenAmount}</p>
      {displayPrice && <p className="text-sm font-medium text-gray-600 -mt-[.2rem]">{displayPrice}</p>}
    </div>
  );
}
