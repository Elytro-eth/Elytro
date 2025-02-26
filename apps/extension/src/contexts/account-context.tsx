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
import { query, query_receive_activities } from '@/requests/query';
import { debounce, DebouncedFunc } from 'lodash';
import { toast } from '@/hooks/use-toast';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isDeployed: false,
  balance: '0',
  chainId: 0,
};

type IAccountContext = {
  currentAccount: TAccountInfo;
  updateAccount: DebouncedFunc<() => Promise<void>>;
  loading: boolean;
  tokenInfo: {
    tokens: TTokenInfo[];
    loading: boolean;
  };
  history: UserOperationHistory[];
  accounts: TAccountInfo[];
  updateHistory: DebouncedFunc<() => Promise<void>>;
  getAccounts: () => Promise<void>;
  updateTokens: DebouncedFunc<() => Promise<void>>;
};

// TODO: extract HistoryContext
const AccountContext = createContext<IAccountContext>({
  currentAccount: DEFAULT_ACCOUNT_INFO,
  updateAccount: debounce(async () => {}, 1000),
  loading: false,
  tokenInfo: {
    tokens: [],
    loading: false,
  },
  history: [],
  updateHistory: debounce(async () => {}, 1000),
  accounts: [],
  getAccounts: async () => {},
  updateTokens: debounce(async () => {}, 1_000),
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
  const [isTokensLoading, setIsTokensLoading] = useState(false);

  const removeInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (searchParams.activating) {
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

  const updateTokens = debounce(async () => {
    if (isTokensLoading) {
      return;
    }

    try {
      setIsTokensLoading(true);
      const tokens = await wallet.getCurrentAccountTokens();
      setTokens((tokens as TTokenInfo[]) || []);
    } catch {
      toast({
        title: 'Failed to get assets',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsTokensLoading(false);
    }
  }, 1_000);

  const updateHistory = debounce(async () => {
    const localHistory = await wallet.getLatestHistories();

    const receives = await getReceiveActivities();

    const res = [...localHistory, ...receives].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setHistory(res);
  }, 1_000);

  useEffect(() => {
    if (!history) {
      updateHistory();
    }

    RuntimeMessage.onMessage(EVENT_TYPES.HISTORY.ITEMS_UPDATED, updateHistory);

    return () => {
      RuntimeMessage.offMessage(updateHistory);
    };
  }, []);

  const getReceiveActivities = async () => {
    try {
      const account = await wallet.getCurrentAccount();
      if (!account?.address) {
        throw new Error('Elytro: No account');
      }

      const res = (await query(query_receive_activities, {
        address: account?.address as Address,
        chainId: toHex(account?.chainId ?? 0),
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
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    if (!loading && !currentAccount.address) {
      updateAccount();
    }
  }, [pathname]);

  const getAccounts = async () => {
    const res = await wallet.getAccounts();
    if (res) {
      setAccounts(res);
    }
  };

  useEffect(() => {
    getAccounts();
  }, []);

  const contextValue = useMemo(
    () => ({
      currentAccount,
      updateAccount,
      tokenInfo: {
        tokens,
        loading: isTokensLoading,
      },
      updateTokens,
      history,
      updateHistory,
      loading,
      accounts,
      getAccounts,
    }),
    [currentAccount, tokens, isTokensLoading, history, loading, accounts]
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
