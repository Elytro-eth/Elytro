import { TokenDTO } from '@/hooks/use-tokens';
import { Select, SelectTrigger, SelectContent } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { formatEther } from 'viem';
import DefaultTokenIcon from '@/assets/icons/ether.svg';
import { useEffect, useState } from 'react';
import TokenItem from '@/components/ui/TokenItem';
import { cn } from '@/utils/shadcn/utils';

function SelectedToken({ token }: { token?: TokenDTO }) {
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
          Balance: {formatEther(BigInt(token.tokenBalance))}
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
  tokens: TokenDTO[];
  className?: string;
  onTokenChange?: (token: TokenDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const defaultToken =
    tokens.find((token) => Number(token.tokenBalance) > 0) ??
    tokens?.[0] ??
    null;
  const [selectedToken, setSelectedToken] = useState<TokenDTO | null>(
    defaultToken
  );
  const handleSelect = (item: TokenDTO) => {
    setSelectedToken(item);
    if (onTokenChange) {
      onTokenChange(item);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (selectedToken && onTokenChange) {
      onTokenChange?.(selectedToken);
    }
  }, []);

  return (
    <Select open={open}>
      <SelectTrigger
        needDropdown={false}
        onClick={() => setOpen(!open)}
        className={cn('border-0', className)}
      >
        <SelectedToken token={selectedToken as TokenDTO} />
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
              key={item.name}
            >
              <TokenItem token={item} />
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
