import DefaultTokenIcon from '@/assets/icons/ether.svg';
import { useAccount } from '@/contexts/account-context';
import { formatPrice, formatTokenAmount } from '@/utils/format';

export default function TokenItem({
  token: { balance, decimals, symbol, logoURI, name, address },
}: {
  token: TTokenInfo;
}) {
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();
  const tokenAmount = formatTokenAmount(String(balance), decimals);
  const price = tokenPrices.find((item) => item.address === address)?.price;

  return (
    <div className="flex flex-row items-center justify-between h-16 px-4">
      <div className="flex flex-row items-center gap-x-2">
        <img
          src={logoURI || DefaultTokenIcon}
          alt={name}
          className="size-8 rounded-full"
        />
        <p className="text-lg font-bold">{name || symbol}</p>
      </div>
      <div className="flex flex-col items-end gap-x-2">
        <p className="text-lg font-bold text-gray-900">
          {tokenAmount} {symbol}
        </p>
        {price && price > 0 && (
          <p className="text-sm font-medium text-gray-600">
            {formatPrice(tokenAmount, price)}
          </p>
        )}
      </div>
    </div>
  );
}
