import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';

type IChainContext = {
  chains: TChainItem[];
  currentChain: TChainItem | null;
  getCurrentChain: () => Promise<void>;
  getChains: () => Promise<void>;
  openExplorer: ({ txHash, opHash }: { txHash?: string; opHash: string }) => void;
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
        title: 'Failed to get networks',
        // description: 'Failed to get chains',
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
        title: 'Failed to get current network',
        // description: 'Failed to get current chain',
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
    async ({ txHash, opHash }: { txHash?: string; opHash: string }) => {
      let chain = currentChain;
      if (!chain) {
        chain = await wallet.getCurrentChain();
        setCurrentChain(chain);
      }
      if (txHash && chain?.blockExplorers?.default?.url) {
        const url = `${chain.blockExplorers.default.url}/tx/${txHash}`;
        chrome.tabs.create({
          url,
        });
      } else if (opHash && chain?.opExplorer) {
        const url = `${chain.opExplorer}${opHash}`;
        chrome.tabs.create({
          url,
        });
      } else {
        toast({
          title: 'Failed to open explorer',
          description: 'No explorer url or hash',
          variant: 'destructive',
        });
        console.error('Elytro chain-context: No explorer url or hash', { txHash, opHash });
      }
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
