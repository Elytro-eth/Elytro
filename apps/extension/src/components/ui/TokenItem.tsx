import DefaultTokenIcon from '@/assets/icons/ether.svg';

import { formatTokenAmount } from '@/utils/format';
export default function TokenItem({ token }: { token: TTokenInfo }) {
  const balance = formatTokenAmount(
    String(token.balance),
    token.decimals,
    token.symbol
  );

  // const price = token.price ? Number(balance) * Number(token.price) : 0;
  return (
    <div className="flex flex-row items-center justify-between h-16 px-4">
      <div className="flex flex-row items-center gap-x-2">
        <img
          src={token.logoURI || DefaultTokenIcon}
          alt={token.name}
          className="size-8 rounded-full"
        />
        <p className="text-lg font-bold">{token.name || token.symbol}</p>
      </div>
      <div className="flex flex-col items-end gap-x-2">
        <p className="text-lg font-bold text-gray-900">{balance}</p>
        {/* <p className="text-sm font-medium text-gray-300">${price}</p> */}
      </div>
    </div>
  );
}
