import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import { useEffect, useState } from 'react';
import { fetchTokens } from '@/utils/tokens';
import { SearchInput } from '@/components/biz/SearchInput';
import { HighlightText } from '@/components/biz/HighlightText';
import { Button } from '@/components/ui/button';
import { isAddress } from 'viem';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { LabelInput } from '@/components/biz/LabelInput';
import { formatAddressToShort } from '@/utils/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TokenConfigItem = ({
  token,
  searchValue,
}: {
  token: TTokenInfo;
  searchType: 'symbol' | 'address';
  searchValue: string;
}) => {
  return (
    <div className="flex items-center gap-x-sm">
      <img src={token.logoURI} alt={token.symbol} className="size-8 rounded-full flex-shrink-0 " />
      <div className="flex flex-col">
        <HighlightText className="elytro-text-smaller-body" text={token.symbol} highlight={searchValue} />
        <Tooltip>
          <TooltipTrigger>
            <HighlightText
              className="elytro-text-tiny-body [&>span]:text-gray-600 cursor-pointer"
              text={formatAddressToShort(token.address)}
              highlight={searchValue}
            />
          </TooltipTrigger>
          <TooltipContent>{token.address}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default function ImportToken() {
  const {
    currentAccount: { chainId },
    tokenInfo: { tokens: existingTokens },
    updateTokens,
  } = useAccount();
  const { wallet } = useWallet();

  const [token, setToken] = useState({} as TTokenInfo);
  const [tokens, setTokens] = useState<TTokenInfo[]>([]);

  const [hasAddressError, setHasAddressError] = useState(false);
  const [hasDecimalsError, setHasDecimalsError] = useState(false);

  const loadTokens = async () => {
    const fetchedTokens = await fetchTokens(chainId);
    setTokens(fetchedTokens);
  };

  useEffect(() => {
    if (!chainId) {
      return;
    }
    loadTokens();
  }, [chainId]);

  const handleSymbolInputChange = (value: string) => {
    setToken((prev) => ({
      ...prev,
      symbol: value,
    }));

    return tokens.filter((t) => t.symbol.toLowerCase().includes(value.toLowerCase()));
  };

  const handleAddressInputChange = (value: string) => {
    setToken((prev) => ({
      ...prev,
      address: value as `0x${string}`,
    }));

    return tokens.filter((t) => t.address.toLowerCase().includes(value.toLowerCase()));
  };

  const handleSelectToken = (token: TTokenInfo) => {
    setToken({
      ...token,
    });
  };

  const handleImportToken = async () => {
    if (existingTokens.find((t) => t.address === token.address)) {
      toast({
        title: 'Token already exists',
        // description: 'Please check your token list',
        variant: 'destructive',
      });
      return;
    }

    try {
      await wallet.importToken({ ...token, name: token?.name || token.symbol });
      updateTokens();

      toast({
        title: 'Token imported successfully',
        variant: 'constructive',
      });

      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } catch (error) {
      console.error('Elytro: Import token failed', error);
    }
  };

  useEffect(() => {
    if (token.address) {
      setHasAddressError(!isAddress(token.address));
    }
  }, [token.address]);

  useEffect(() => {
    if (token.decimals !== undefined) {
      setHasDecimalsError(!token.decimals || token.decimals === 0);
    }
  }, [token.decimals]);

  return (
    <SecondaryPageWrapper title="Import token">
      <div className="flex flex-col gap-y-md ">
        <SearchInput<TTokenInfo>
          label="Currency symbol"
          input={token.symbol}
          onSearch={handleSymbolInputChange}
          onSelect={handleSelectToken}
          renderItem={(token) => <TokenConfigItem token={token} searchType="symbol" searchValue={token.symbol} />}
          placeholder="ETH"
        />

        <div className="flex flex-col gap-y-2xs">
          <SearchInput<TTokenInfo>
            label="Token contract address"
            input={token.address}
            onSearch={handleAddressInputChange}
            onSelect={handleSelectToken}
            renderItem={(token) => <TokenConfigItem token={token} searchType="address" searchValue={token.address} />}
            placeholder="0x"
          />
          {hasAddressError && <p className="elytro-text-tiny-body text-red">Invalid address</p>}
        </div>

        <div className="flex flex-col gap-y-2xs">
          <LabelInput
            label="Decimals"
            type="number"
            value={token.decimals > 0 ? token.decimals : ''}
            onChange={(e) =>
              setToken((prev) => ({
                ...prev,
                decimals: Number(e.target.value),
              }))
            }
            placeholder="18"
          />
          {hasDecimalsError && <p className="elytro-text-tiny-body text-red">Decimals cannot be empty or 0</p>}
        </div>

        <LabelInput
          label="Token name"
          value={token.name}
          onChange={(e) => setToken((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="ETH"
        />

        <Button
          onClick={handleImportToken}
          disabled={!token.address || !token.symbol || !token.decimals || hasAddressError || hasDecimalsError}
        >
          Continue
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
