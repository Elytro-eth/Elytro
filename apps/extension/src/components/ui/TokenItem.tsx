import DefaultTokenIcon from '@/assets/icons/ether.svg';
import TokenBalanceItem from '../biz/TokenBalanceItem';

export default function TokenItem({ token }: { token: TTokenInfo }) {
  return (
    <div className="flex flex-row items-center justify-between h-16 px-4">
      <div className="flex flex-row items-center gap-x-2">
        <img
          src={token?.logoURI || DefaultTokenIcon}
          alt={token?.name}
          className="size-8 rounded-full"
        />
        <p className="text-lg font-bold">{token?.symbol}</p>
      </div>
      <TokenBalanceItem
        amount={token?.balance || 0}
        decimals={token?.decimals}
        symbol={token?.symbol}
        address={token?.address}
      />
    </div>
  );
}
