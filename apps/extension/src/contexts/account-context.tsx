import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { useHashLocation } from 'wouter/use-hash-location';
import useSearchParams from '@/hooks/use-search-params';
import { Address } from 'viem';
import useTokens, { TokenDTO } from '@/hooks/use-tokens';
import { UserOperationHistory } from '@/constants/operations';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';
import { removeSearchParamsOfCurrentWindow } from '@/utils/url';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isDeployed: false,
  balance: '0',
  chainId: 0,
};

type IAccountContext = {
  currentAccount: TAccountInfo;
  updateAccount: () => Promise<void>;
  loading: boolean;
  tokenInfo: {
    tokens: TokenDTO[];
    loadingTokens: boolean;
  };
  history: UserOperationHistory[];
  accounts: TAccountInfo[];
  updateHistory: () => Promise<void>;
  getAccounts: () => Promise<void>;
  updateTokens: () => Promise<void>;
};

// TODO: extract HistoryContext
const AccountContext = createContext<IAccountContext>({
  currentAccount: DEFAULT_ACCOUNT_INFO,
  updateAccount: async () => {},
  loading: false,
  tokenInfo: {
    tokens: [],
    loadingTokens: false,
  },
  history: [],
  updateHistory: async () => {},
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

  const updateAccount = async () => {
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
  };

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

  // TODO: check this logic
  const updateHistory = async () => {
    const res = await wallet.getLatestHistories();

    setHistory(res);
  };

  useEffect(() => {
    if (!history) {
      updateHistory();
    }

    RuntimeMessage.onMessage(EVENT_TYPES.HISTORY.ITEMS_UPDATED, updateHistory);

    return () => {
      RuntimeMessage.offMessage(updateHistory);
    };
  }, []);

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

  return (
    <AccountContext.Provider
      value={{
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
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  return useContext(AccountContext);
};
