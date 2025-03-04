import { Select, SelectTrigger, SelectContent } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import DefaultTokenIcon from '@/assets/icons/ether.svg';
import { useEffect, useState, useCallback, memo } from 'react';
import TokenItem from '@/components/ui/TokenItem';
import { cn } from '@/utils/shadcn/utils';
import { formatTokenAmount } from '@/utils/format';

const SelectedToken = memo(({ token }: { token?: TTokenInfo }) => {
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
        alt={token.name || 'Token'}
      />
      <div className="text-left ml-2">
        <div className="flex items-center">
          <div className="text-lg font-bold">{token.name || token.symbol}</div>
          <ChevronDown className="stroke-gray-600 ml-2" />
        </div>

        <div className="text-gray-600 -mt-0.5">
          Balance:{' '}
          {formatTokenAmount(token.balance || 0, token.decimals, token.symbol)}
        </div>
      </div>
    </div>
  );
});

SelectedToken.displayName = 'SelectedToken';

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

  const defaultToken = useCallback(() => {
    return (
      tokens.find(
        (token) => token.balance !== undefined && token.balance > 0
      ) ||
      tokens[0] ||
      null
    );
  }, [tokens]);

  const [selectedToken, setSelectedToken] = useState<TTokenInfo | null>();

  useEffect(() => {
    if (!selectedToken && tokens.length > 0) {
      const newDefaultToken = defaultToken();
      setSelectedToken(newDefaultToken);
      onTokenChange?.(newDefaultToken);
    }
  }, [tokens, selectedToken, defaultToken, onTokenChange]);

  const handleSelect = useCallback(
    (item: TTokenInfo) => {
      if (!item || item.symbol === selectedToken?.symbol) {
        setOpen(false);
        return;
      }

      const safeToken: TTokenInfo = {
        ...item,
        name: item.name || item.symbol,
        balance: item.balance || 0,
        logoURI: item.logoURI || '',
        address: item.address,
      };

      setSelectedToken(safeToken);
      onTokenChange?.(safeToken);
      setOpen(false);
    },
    [selectedToken, onTokenChange]
  );

  const toggleDropdown = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Select open={open} onOpenChange={setOpen}>
      <SelectTrigger
        needDropdown={false}
        onClick={toggleDropdown}
        className={cn('border-0', className)}
      >
        <SelectedToken token={selectedToken as TTokenInfo} />
      </SelectTrigger>
      <SelectContent
        className="rounded-3xl bg-white overflow-hidden w-full"
        onPointerDownOutside={handleClose}
        onEscapeKeyDown={handleClose}
      >
        {tokens.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No tokens available
          </div>
        ) : (
          tokens.map((item) => (
            <div
              onClick={() => handleSelect(item)}
              className="cursor-pointer hover:bg-gray-200"
              key={`${item.symbol}-${item.address || 'native'}`}
            >
              <TokenItem token={item} />
            </div>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
