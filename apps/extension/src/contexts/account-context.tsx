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
import useTokens, { TokenDTO } from '@/hooks/use-tokens';
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
    tokens: TokenDTO[];
    loadingTokens: boolean;
  };
  history: UserOperationHistory[];
  accounts: TAccountInfo[];
  updateHistory: DebouncedFunc<() => Promise<void>>;
  getAccounts: () => Promise<void>;
  updateTokens: () => Promise<void>;
};

// TODO: extract HistoryContext
const AccountContext = createContext<IAccountContext>({
  currentAccount: DEFAULT_ACCOUNT_INFO,
  updateAccount: debounce(async () => {}, 1000),
  loading: false,
  tokenInfo: {
    tokens: [],
    loadingTokens: false,
  },
  history: [],
  updateHistory: debounce(async () => {}, 1000),
  accounts: [],
  getAccounts: async () => {},
  updateTokens: async () => {},
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

  const updateAccount = debounce(async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const res = (await wallet.getCurrentAccount()) ?? DEFAULT_ACCOUNT_INFO;
      setCurrentAccount(res);
      updateHistory();

      if (intervalRef.current && res.isDeployed) {
        removeSearchParamsOfCurrentWindow('activating');
        removeInterval();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(intervalRef.current ? true : false);
    }
  }, 1000);

  const { tokens, loadingTokens, refetchTokens } = useTokens({
    address: currentAccount.address as Address,
    chainId: currentAccount.chainId,
  });

  const updateTokens = async () => {
    if (loading || !currentAccount.address) {
      return;
    }

    await refetchTokens();
  };

  const updateHistory = debounce(async () => {
    const localHistory = await wallet.getLatestHistories();

    const receives = await getReceiveActivities();

    const res = [...localHistory, ...receives].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setHistory(res);
  }, 1000);

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

      const transactions = res.transactions.map((item: SafeAny) => {
        return {
          type: HistoricalActivityTypeEn.Receive,
          from: item.list[0].asset_from,
          to: item.list[0].asset_to,
          value: item.list[0].asset_value,
          timestamp: item.timestamp * 1000,
          opHash: item.opHash || item.txhash,
          status: UserOperationStatusEn.confirmedSuccess,
          decimals: item.list[0].decimals,
          symbol: item.list[0].symbol,
        };
      });

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
      }, 1000);
    }

    return removeInterval;
  }, [searchParams]);

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
        loadingTokens,
      },
      updateTokens,
      history,
      updateHistory,
      loading,
      accounts,
      getAccounts,
    }),
    [currentAccount, tokens, loadingTokens, history, loading, accounts]
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
