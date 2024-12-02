import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { useHashLocation } from 'wouter/use-hash-location';
import useSearchParams from '@/hooks/use-search-params';
import { Address, Chain } from 'viem';
import useTokens, { TokenDTO } from '@/hooks/use-tokens';
import { UserOperationHistory } from '@/constants/operations';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';
import { Account } from '@/background/services/accountManager';

const DEFAULT_ACCOUNT_INFO: TAccountInfo = {
  address: '',
  isActivated: false,
  balance: '0',
  ownerAddress: '',
};

type IAccountContext = {
  accountInfo: TAccountInfo;
  updateAccount: () => Promise<void>;
  loading: boolean;
  tokenInfo: {
    tokens: TokenDTO[];
    loadingTokens: boolean;
  };
  history: UserOperationHistory[];
  chains: Chain[];
  accounts: Account[];
  currentChain: Chain | null;
  updateHistory: () => Promise<void>;
};

const AccountContext = createContext<IAccountContext>({
  accountInfo: DEFAULT_ACCOUNT_INFO,
  updateAccount: async () => {},
  loading: false,
  tokenInfo: {
    tokens: [],
    loadingTokens: false,
  },
  history: [],
  updateHistory: async () => {},
  chains: [],
  accounts: [],
  currentChain: null,
});

export const AccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const wallet = useWallet();
  const [accountInfo, setAccountInfo] =
    useState<TAccountInfo>(DEFAULT_ACCOUNT_INFO);
  const [loading, setLoading] = useState(false);
  const [pathname] = useHashLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<UserOperationHistory[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);

  const updateAccount = async () => {
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      const res = (await wallet.getSmartAccountInfo()) ?? DEFAULT_ACCOUNT_INFO;
      setAccountInfo(res);

      if (intervalRef.current && res.isActivated) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(intervalRef.current ? true : false);
    }
  };

  const { tokens, loadingTokens } = useTokens({
    address: accountInfo.address as Address,
    chainId: currentChain?.id || 0,
  });

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
  }, []);

  useEffect(() => {
    if (!loading && !accountInfo.address) {
      updateAccount();
    }
  }, [pathname]);

  useEffect(() => {
    if (searchParams.activating) {
      intervalRef.current = setInterval(() => {
        updateAccount();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams]);

  const getCurrentChain = async () => {
    const chain = await wallet.getCurrentChain();
    setCurrentChain(chain);
  };

  const getChains = async () => {
    const res = await wallet.getChains();
    if (res) {
      setChains(res);
    }
  };

  const updateChains = () => {
    getChains();
    getCurrentChain();
  };

  useEffect(() => {
    updateChains();

    RuntimeMessage.onMessage(EVENT_TYPES.NETWORK.ITEMS_UPDATED, updateChains);
  }, []);

  const getAccounts = async () => {
    const res = await wallet.getAccounts();
    if (res) {
      setAccounts(res);
    }
  };

  useEffect(() => {
    getAccounts();

    RuntimeMessage.onMessage(EVENT_TYPES.ACCOUNT.ITEMS_UPDATED, getAccounts);
  }, []);

  return (
    <AccountContext.Provider
      value={{
        accountInfo,
        updateAccount,
        tokenInfo: {
          tokens,
          loadingTokens,
        },
        history,
        updateHistory,
        loading,
        chains,
        accounts,
        currentChain,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  return useContext(AccountContext);
};
