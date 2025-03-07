import { useAccount } from '@/contexts/account-context';
import { formatTokenAmount } from '@/utils/format';

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
  const { getDollarBalanceByToken } = useAccount();
  const tokenAmount = formatTokenAmount(String(amount), decimals);
  const displayPrice = getDollarBalanceByToken({
    tokenContractAddress: address,
    symbol,
    balance: Number(tokenAmount),
  });

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
