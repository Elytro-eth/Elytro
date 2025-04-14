import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWallet } from '@/contexts/wallet';
import { useHashLocation } from 'wouter/use-hash-location';
import useSearchParams from '@/hooks/use-search-params';
import { Address, toHex } from 'viem';
import {
  UserOperationStatusEn,
  HistoricalActivityTypeEn,
  UserOperationHistory,
} from '@/constants/operations';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';
import { removeSearchParamsOfCurrentWindow } from '@/utils/url';
import {
  query,
  query_receive_activities,
  query_token_price,
} from '@/requests/query';
import { debounce, DebouncedFunc } from 'lodash';
import { toast } from '@/hooks/use-toast';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isDeployed: false,
  balance: 0,
  chainId: 0,
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
  reloadAccount: DebouncedFunc<(isForce?: boolean) => Promise<void>>;
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
  reloadAccount: debounce(async () => {}, 1_000),
});

export const AccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wallet } = useWallet();
  const [currentAccount, setCurrentAccount] =
    useState<TAccountInfo>(DEFAULT_ACCOUNT_INFO);
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

  const updateAccount = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const res = (await wallet.getCurrentAccount()) ?? DEFAULT_ACCOUNT_INFO;

      setCurrentAccount(res);

      if (intervalRef.current && res.isDeployed) {
        removeSearchParamsOfCurrentWindow('activating');
        removeInterval();
      }
    } catch (error) {
      console.error(error);
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

      const priceMap = new Map(
        res.tokenPrices.map((item: TTokenPrice) => [item.address, item])
      );

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

  const updateTokens = async () => {
    if (isTokensLoading) {
      return;
    }

    try {
      setIsTokensLoading(true);
      const tokens = (await wallet.getCurrentAccountTokens()) as TTokenInfo[];
      setTokens(tokens);
      updateTokenPrices(tokens);
    } catch {
      toast({
        title: 'Failed to get tokens',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsTokensLoading(false);
    }
  };

  const getReceiveActivities = async () => {
    try {
      const res = (await query(query_receive_activities, {
        address: currentAccount?.address as Address,
        chainId: toHex(currentAccount?.chainId ?? 0),
      })) as SafeAny;

      const transactions = res.transactions.map((item: SafeAny) => ({
        type: HistoricalActivityTypeEn.Receive,
        from: item.list[0].asset_from,
        to: item.list[0].asset_to,
        value: item.list[0].asset_value,
        timestamp: item.timestamp * 1000,
        opHash: item.opHash || item.txhash,
        status: UserOperationStatusEn.confirmedSuccess,
        decimals: item.list[0].decimals,
        symbol: item.list[0].symbol,
      }));

      return transactions || [];
    } catch {
      return [];
    }
  };

  const updateHistory = async () => {
    if (!currentAccount.address) {
      return;
    }

    const localHistory = await wallet.getLatestHistories();

    const receives = await getReceiveActivities();

    const res = [...localHistory, ...receives].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setHistory(res);
  };

  useEffect(() => {
    if (!currentAccount.address) {
      reloadAccount();
    }
  }, [pathname]);

  const onHistoryUpdated = () => {
    updateHistory();
    updateTokens();
  };

  useEffect(() => {
    if (currentAccount.address) {
      updateHistory();
      updateTokens();

      RuntimeMessage.onMessage(
        EVENT_TYPES.HISTORY.ITEMS_UPDATED,
        onHistoryUpdated
      );

      return () => {
        RuntimeMessage.offMessage(onHistoryUpdated);
      };
    }
  }, [currentAccount.address]);

  const getAccounts = async () => {
    const res = await wallet.getAccounts();
    if (res) {
      setAccounts(res);
    }
  };

  const reloadAccount = debounce(async (isForce?: boolean) => {
    await updateAccount();

    if (isForce) {
      await updateHistory();
      await updateTokens();
    }
  }, 300);

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
    [
      currentAccount,
      tokens,
      isTokensLoading,
      history,
      loading,
      accounts,
      tokenPrices,
    ]
  );

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  return useContext(AccountContext);
};
