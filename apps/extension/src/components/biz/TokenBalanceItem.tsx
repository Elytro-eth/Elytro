import { useAccount } from '@/contexts/account-context';
import { formatDollarBalance, formatTokenAmount } from '@/utils/format';
import { useMemo } from 'react';

interface ITokenBalanceItemProps {
  amount: number | string;
  decimals: number;
  symbol: string;
  address: `0x${string}`;
}

export default function TokenBalanceItem({
  amount,
  decimals,
  symbol,
  address,
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
    });

    return [tokenAmount, displayPrice];
  }, [amount, decimals, address, symbol, tokenPrices]);

  return (
    <div className="flex flex-col items-end gap-x-sm">
      <p className="text-lg font-bold text-gray-900">
        {tokenAmount} {symbol}
      </p>
      {displayPrice && (
        <p className="text-sm font-medium text-gray-600">{displayPrice}</p>
      )}
    </div>
  );
}
