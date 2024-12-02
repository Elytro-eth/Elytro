import { TokenDTO } from '@/hooks/use-tokens';
import TokenItem from './TokenItem';
import { formatEther, hexToBigInt } from 'viem';

interface TokenListProps {
  data: TokenDTO[];
}

export default function TokenList({ data }: TokenListProps) {
  return (
    <div className="flex flex-col gap-y-2">
      {data.map((item) => {
        const balance = formatEther(hexToBigInt(item.tokenBalance));
        const price = item.price > 0 ? Number(balance) / Number(item.price) : 0;
        return (
          <TokenItem
            key={item.name}
            name={item.symbol || item.name}
            balance={balance.slice(0, item.decimals)}
            price={price.toFixed(3)}
            icon={item.logoURI}
          />
        );
      })}
    </div>
  );
}
