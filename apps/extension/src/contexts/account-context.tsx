import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { useHashLocation } from 'wouter/use-hash-location';
import useSearchParams from '@/hooks/use-search-params';
import { Address, toHex } from 'viem';
import { UserOperationStatusEn, HistoricalActivityTypeEn, UserOperationHistory } from '@/constants/operations';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';
import { removeSearchParamsOfCurrentWindow } from '@/utils/url';
import { query, query_receive_activities, query_token_price } from '@/requests/query';
import { debounce, DebouncedFunc } from 'lodash';
import { toast } from '@elytro/ui';
import { useInterval } from 'usehooks-ts';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isDeployed: false,
  balance: 0,
  chainId: 0,
  owner: '',
  isRecoveryEnabled: false,
};

type IAccountContext = {
  currentAccount: TAccountInfo;
  loading: boolean;
  tokenInfo: {
    tokens: TTokenInfo[];
    loading: boolean;
    tokenPrices: TTokenPrice[];
  };
  history: UserOperationHistory[];
  accounts: TAccountInfo[];
  getAccounts: () => Promise<void>;
  updateTokens: () => Promise<void>;
  reloadAccount: DebouncedFunc<(isForce?: boolean, minLoadingDuration?: number) => Promise<void>>;
};

// TODO: extract HistoryContext
const AccountContext = createContext<IAccountContext>({
  currentAccount: DEFAULT_ACCOUNT_INFO,
  loading: false,
  tokenInfo: {
    tokens: [],
    loading: false,
    tokenPrices: [],
  },
  history: [],
  accounts: [],
  getAccounts: async () => {},
  updateTokens: async () => {},
  reloadAccount: debounce(async (_isForce?: boolean, _minLoadingDuration?: number) => {}, 1_000),
});

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const [currentAccount, setCurrentAccount] = useState<TAccountInfo>(DEFAULT_ACCOUNT_INFO);
  const [loading, setLoading] = useState(false);
  const [pathname] = useHashLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<UserOperationHistory[]>([]);
  const [accounts, setAccounts] = useState<TAccountInfo[]>([]);
  const [tokens, setTokens] = useState<TTokenInfo[]>([]);
  const [tokenPrices, setTokenPrices] = useState<TTokenPrice[]>([]);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const removeInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (searchParams.activating === '1') {
      intervalRef.current = setInterval(() => {
        updateAccount();
      }, 1_000);
    }

    return removeInterval;
  }, [searchParams]);

  const updateAccount = async (minLoadingDuration?: number) => {
    if (loading) {
      return;
    }

    const startTime = Date.now();

    try {
      setLoading(true);

      const res = (await wallet.getCurrentAccount()) ?? DEFAULT_ACCOUNT_INFO;

      setCurrentAccount(res);

      if (intervalRef.current && res.isDeployed) {
        removeSearchParamsOfCurrentWindow('activating');
        removeInterval();
      }

      // Ensure minimum loading duration if specified
      if (minLoadingDuration) {
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingDuration) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingDuration - elapsed));
        }
      }
    } catch (error) {
      console.error('Elytro: updateAccount error', error);
      // If getCurrentAccount fails, try to use cached account info
      // This prevents the app from being completely stuck
      const cachedAccount = currentAccount;
      if (cachedAccount && cachedAccount.address) {
        console.warn('Elytro: Using cached account info due to updateAccount error');
        setCurrentAccount(cachedAccount);
      }
    } finally {
      setLoading(intervalRef.current ? true : false);
    }
  };

  const updateTokenPrices = async (lastTokens: TTokenInfo[]) => {
    if (!lastTokens || lastTokens.length === 0 || !currentAccount.chainId) {
      return;
    }

    try {
      const res = (await query(query_token_price, {
        chainId: toHex(currentAccount.chainId),
        contractAddresses: lastTokens.map((token) => token.address),
      })) as SafeAny;

      const priceMap = new Map(res.tokenPrices.map((item: TTokenPrice) => [item.address, item]));

      const formattedTokenPrices = lastTokens.map((token) => {
        const price = priceMap.get(token.address) || {};
        return {
          ...price,
          symbol: token.symbol,
        } as TTokenPrice;
      });

      setTokenPrices(formattedTokenPrices);
    } catch {
      setTokenPrices([]);
    }
  };

  const updateTokens = async (silent = false) => {
    if (isTokensLoading) {
      return;
    }

    try {
      if (!silent) {
        setIsTokensLoading(true);
      }
      const tokens = (await wallet.getCurrentAccountTokens()) as TTokenInfo[];
      setTokens(tokens);
      updateTokenPrices(tokens);
    } catch {
      if (!silent) {
        toast({
          title: 'Failed to get tokens, please try again',
          // description: 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) {
        setIsTokensLoading(false);
      }
    }
  };

  const getReceiveActivities = async () => {
    try {
      const res = (await query(query_receive_activities, {
        address: currentAccount?.address as Address,
        chainId: toHex(currentAccount?.chainId ?? 0),
      })) as SafeAny;

      const transactions = res.transactions
        .map((item: SafeAny) => {
          if (item.type === 'receive') {
            return {
              type: HistoricalActivityTypeEn.Receive,
              from: item.list[0].asset_from,
              to: item.list[0].asset_to,
              value: item.list[0].asset_value,
              timestamp: item.timestamp * 1000,
              opHash: item.opHash,
              txHash: item.txhash,
              status: UserOperationStatusEn.confirmedSuccess,
              decimals: item.list[0].decimals,
              symbol: item.list[0].symbol,
            };
          }
          // else {
          //   return {
          //     type: HistoricalActivityTypeEn.ContractInteract,
          //     from: currentAccount.address,
          //     opHash: item.opHash || item.txhash,
          //     txHash: item.txhash,
          //     timestamp: item.timestamp * 1000,
          //     status: UserOperationStatusEn.confirmedSuccess,
          //   };
          // }
        })
        .filter(Boolean);

      return transactions || [];
    } catch {
      return [];
    }
  };

  const updateHistory = async () => {
    if (!currentAccount.address) {
      return;
    }

    const [localHistory, receives] = await Promise.all([wallet.getLatestHistories(), getReceiveActivities()]);
    const res = [...localHistory, ...receives].sort((a, b) => b.timestamp - a.timestamp);
    setHistory(res);
  };

  useEffect(() => {
    if (!currentAccount.address) {
      reloadAccount();
    }
  }, [pathname]);

  const onHistoryUpdated = (silent = false) => {
    updateHistory();
    updateTokens(silent);
  };

  useEffect(() => {
    if (currentAccount.address) {
      updateHistory();
      updateTokens();

      const handleHistoryUpdated = () => {
        updateHistory();
        updateTokens(true);
      };

      RuntimeMessage.onMessage(EVENT_TYPES.HISTORY.ITEMS_UPDATED, handleHistoryUpdated);

      return () => {
        RuntimeMessage.offMessage(handleHistoryUpdated);
      };
    }
  }, [currentAccount.address]);

  const getAccounts = async () => {
    const res = await wallet.getAccounts();
    if (res) {
      setAccounts(res);
    }
  };

  const reloadAccount = debounce(async (isForce?: boolean, minLoadingDuration?: number) => {
    await updateAccount(minLoadingDuration);

    if (isForce) {
      await Promise.all([updateHistory(), updateTokens()]);
    }
  }, 300);

  useInterval(() => {
    onHistoryUpdated(true);
  }, 20_000);

  const contextValue = useMemo(
    () => ({
      currentAccount,
      tokenInfo: {
        tokens,
        loading: isTokensLoading,
        tokenPrices,
      },
      updateTokens,
      history,
      loading,
      accounts,
      getAccounts,
      reloadAccount,
    }),
    [currentAccount, tokens, isTokensLoading, history, loading, accounts, tokenPrices]
  );

  return <AccountContext.Provider value={contextValue}>{children}</AccountContext.Provider>;
};

export const useAccount = () => {
  return useContext(AccountContext);
};
