import { Select, SelectTrigger, SelectContent } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import DefaultTokenIcon from '@/assets/icons/ether.svg';
import { useEffect, useState } from 'react';
import TokenItem from '@/components/ui/TokenItem';
import { cn } from '@/utils/shadcn/utils';
import { formatTokenAmount } from '@/utils/format';

function SelectedToken({ token }: { token?: TTokenInfo }) {
  if (!token)
    return (
      <div className="flex items-center">
        <div className="text-md w-full text-left">Select a token</div>
        <ChevronDown className="stroke-gray-600" />
      </div>
    );

  return (
    <div className="flex items-center w-full">
      <img
        className="h-10 w-10"
        src={token.logoURI || DefaultTokenIcon}
        alt={token.name}
      />
      <div className="text-left ml-2">
        <div className="flex items-center">
          <div className="text-lg font-bold">{token.name}</div>
          <ChevronDown className="stroke-gray-600" />
        </div>

        <div className="text-gray-600 -mt-0.5">
          Balance:{' '}
          {formatTokenAmount(token.balance, token.decimals, token.symbol)}
        </div>
      </div>
    </div>
  );
}

export default function TokenSelector({
  tokens,
  className,
  onTokenChange,
}: {
  tokens: TTokenInfo[];
  className?: string;
  onTokenChange?: (token: TTokenInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const defaultToken =
    tokens.find((token) => token.balance !== undefined && token.balance > 0) ??
    tokens?.[0] ??
    null;

  const [selectedToken, setSelectedToken] = useState<TTokenInfo | null>(
    defaultToken
  );

  const handleSelect = (item: TTokenInfo) => {
    if (item.symbol !== selectedToken?.symbol) {
      setSelectedToken(item);
      onTokenChange?.(item);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (selectedToken) {
      onTokenChange?.(selectedToken);
    }
  }, [selectedToken]);

  return (
    <Select open={open}>
      <SelectTrigger
        needDropdown={false}
        onClick={() => setOpen(!open)}
        className={cn('border-0', className)}
      >
        <SelectedToken token={selectedToken as TTokenInfo} />
      </SelectTrigger>
      <SelectContent
        className="rounded-3xl bg-white overflow-hidden w-full"
        onPointerDownOutside={() => setOpen(false)}
      >
        {tokens.map((item) => {
          return (
            <div
              onClick={() => handleSelect(item)}
              className="cursor-pointer hover:bg-gray-200"
              key={item.address}
            >
              <TokenItem token={item} />
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
