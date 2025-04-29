import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useWallet } from '@/contexts/wallet';
import { TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';

type IChainContext = {
  chains: TChainItem[];
  currentChain: TChainItem | null;
  getCurrentChain: () => Promise<void>;
  getChains: () => Promise<void>;
  openExplorer: ({
    txHash,
    opHash,
  }: {
    txHash?: string;
    opHash: string;
  }) => void;
};

const ChainContext = createContext<IChainContext>({
  chains: [],
  currentChain: null,
  getCurrentChain: async () => {},
  getChains: async () => {},
  openExplorer: () => {},
});

export const ChainProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const [chains, setChains] = useState<TChainItem[]>([]);
  const [currentChain, setCurrentChain] = useState<TChainItem | null>(null);
  const [pathname] = useEnhancedHashLocation();

  const getChains = async () => {
    try {
      const res = await wallet.getChains();
      setChains(res);
    } catch (error) {
      console.error('Elytro chain-context: Failed to get chains', error);
      toast({
        title: 'Error',
        description: 'Failed to get chains',
      });
    }
  };

  const getCurrentChain = async () => {
    try {
      const res = await wallet.getCurrentChain();
      setCurrentChain(res);
    } catch (error) {
      console.error('Elytro chain-context: Failed to get current chain', error);
      toast({
        title: 'Error',
        description: 'Failed to get current chain',
      });
    }

    const res = await wallet.getCurrentChain();
    setCurrentChain(res);
  };

  useEffect(() => {
    getChains();
    getCurrentChain();
  }, [pathname]);

  const openExplorer = useCallback(
    ({ txHash, opHash }: { txHash?: string; opHash: string }) => {
      if (txHash && currentChain?.blockExplorers?.default?.url) {
        const url = `${currentChain.blockExplorers.default.url}/tx/${txHash}`;
        chrome.tabs.create({
          url,
        });
        return;
      } else if (opHash && currentChain?.opExplorer) {
        const url = `${currentChain.opExplorer}/${opHash}`;

        chrome.tabs.create({
          url,
        });
        return;
      }

      toast({
        title: 'Failed to open explorer',
        description: 'No explorer url or hash',
        variant: 'destructive',
      });
    },
    [currentChain]
  );

  return (
    <ChainContext.Provider
      value={{
        chains,
        currentChain,
        getCurrentChain,
        getChains,
        openExplorer,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  return useContext(ChainContext);
};
