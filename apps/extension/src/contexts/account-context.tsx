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
import { formatPrice } from '@/utils/format';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isDeployed: false,
  balance: 0,
  chainId: 0,
};

type IAccountContext = {
  currentAccount: TAccountInfo;
  updateAccount: () => Promise<void>;
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
  reloadAccount: DebouncedFunc<() => Promise<void>>;
  getDollarBalanceByToken: (info: {
    tokenContractAddress?: string;
    symbol?: string;
    balance: number;
  }) => string | null;
};

// TODO: extract HistoryContext
const AccountContext = createContext<IAccountContext>({
  currentAccount: DEFAULT_ACCOUNT_INFO,
  updateAccount: async () => {},
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
  getDollarBalanceByToken: () => null,
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

  const updateTokenPrices = async () => {
    if (
      !tokens ||
      tokens.length === 0 ||
      isTokensLoading ||
      !currentAccount.chainId
    ) {
      return;
    }

    try {
      const res = (await query(query_token_price, {
        chainId: toHex(currentAccount.chainId),
        contractAddresses: tokens.map((token) => token.address),
      })) as SafeAny;

      const priceMap = new Map(
        res.tokenPrices.map((item: TTokenPrice) => [item.address, item])
      );

      const formattedTokenPrices = tokens.map((token) => {
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

  useEffect(() => {
    updateTokenPrices();
  }, [tokens]);

  const getDollarBalanceByToken = ({
    tokenContractAddress,
    symbol,
    balance,
  }: {
    tokenContractAddress?: string;
    symbol?: string;
    balance: number;
  }) => {
    const price =
      tokenPrices.find(
        (item) =>
          item.address === tokenContractAddress || item.symbol === symbol
      )?.price || 0;
    return price > 0 ? formatPrice(balance, price) : null;
  };

  const updateTokens = async () => {
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
  };

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

  const updateHistory = async () => {
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
    RuntimeMessage.onMessage(
      EVENT_TYPES.HISTORY.ITEMS_UPDATED,
      onHistoryUpdated
    );

    return () => {
      RuntimeMessage.offMessage(onHistoryUpdated);
    };
  }, []);

  const getAccounts = async () => {
    const res = await wallet.getAccounts();
    if (res) {
      setAccounts(res);
    }
  };

  const reloadAccount = debounce(async () => {
    await updateAccount();
    await updateTokens();
    await updateHistory();
  }, 300);

  const contextValue = useMemo(
    () => ({
      currentAccount,
      updateAccount,
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
      getDollarBalanceByToken,
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
