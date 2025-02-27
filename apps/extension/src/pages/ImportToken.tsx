import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import { useEffect, useState } from 'react';
import { fetchTokens } from '@/utils/tokens';
import { SearchInput } from '@/components/biz/SearchInput';
import { HighlightText } from '@/components/biz/HighlightText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isAddress } from 'viem';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

const INPUT_CLASS_NAME = 'bg-gray-150 rounded-md py-sm px-lg';

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
      <img
        src={token.logoURI}
        alt={token.symbol}
        className="size-8 rounded-full flex-shrink-0 "
      />
      <div className="flex flex-col">
        <HighlightText
          className="elytro-text-smaller-body"
          text={token.symbol}
          highlight={searchValue}
        />
        <HighlightText
          className="elytro-text-tiny-body"
          text={token.address}
          highlight={searchValue}
        />
      </div>
    </div>
  );
};

export default function ImportToken() {
  const {
    currentAccount: { chainId },
    tokenInfo: { tokens: existingTokens },
    reloadAccount,
  } = useAccount();
  const { wallet } = useWallet();

  const [token, setToken] = useState({} as TTokenInfo);
  const [tokens, setTokens] = useState<TTokenInfo[]>([]);

  const [hasAddressError, setHasAddressError] = useState(false);

  const loadTokens = async () => {
    const fetchedTokens = await fetchTokens(chainId, 100);
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

    return tokens.filter((token) =>
      token.symbol.toLowerCase().includes(value.toLowerCase())
    );
  };

  const handleAddressInputChange = (value: string) => {
    setToken((prev) => ({
      ...prev,
      address: value as `0x${string}`,
    }));

    return tokens.filter((token) =>
      token.address.toLowerCase().includes(value.toLowerCase())
    );
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
        description: 'Please check your token list',
        variant: 'destructive',
      });
      return;
    }

    try {
      await wallet.importToken({ ...token, name: token?.name || token.symbol });
      reloadAccount();
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

  return (
    <SecondaryPageWrapper title="Import Token">
      <div className="flex flex-col gap-y-sm ">
        <SearchInput<TTokenInfo>
          className={INPUT_CLASS_NAME}
          input={token.symbol}
          onSearch={handleSymbolInputChange}
          onSelect={handleSelectToken}
          renderItem={(token) => (
            <TokenConfigItem
              token={token}
              searchType="symbol"
              searchValue={token.symbol}
            />
          )}
          placeholder="Currency symbol"
        />

        <div className="flex flex-col gap-y-2xs">
          <SearchInput<TTokenInfo>
            className={INPUT_CLASS_NAME}
            input={token.address}
            onSearch={handleAddressInputChange}
            onSelect={handleSelectToken}
            renderItem={(token) => (
              <TokenConfigItem
                token={token}
                searchType="address"
                searchValue={token.address}
              />
            )}
            placeholder="Token contract address"
          />
          {hasAddressError && (
            <p className="elytro-text-tiny-body text-red">Invalid address</p>
          )}
        </div>

        <Input
          className={INPUT_CLASS_NAME}
          type="number"
          value={token.decimals}
          onChange={(e) =>
            setToken((prev) => ({
              ...prev,
              decimals: Number(e.target.value),
            }))
          }
          placeholder="Decimals"
        />

        <Input
          className={INPUT_CLASS_NAME}
          value={token.name}
          onChange={(e) =>
            setToken((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Token name"
        />

        <Button
          className="mt-3xl"
          onClick={handleImportToken}
          disabled={
            !token.address ||
            !token.symbol ||
            !token.decimals ||
            hasAddressError
          }
        >
          Continue
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
