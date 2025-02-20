import { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';

type IChainContext = {
  chains: TChainItem[];
  currentChain: TChainItem | null;
  getCurrentChain: () => Promise<void>;
  getChains: () => Promise<void>;
  openExplorer: (hash: string, isOp?: boolean) => void;
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
  }, []);

  const openExplorer = (hash: string, isOp = true) => {
    const url = isOp
      ? `${currentChain?.opExplorer || 'https://jiffyscan.xyz/userOpHash/'}${hash}`
      : `${currentChain?.blockExplorers?.default.url}/tx/${hash}`;

    chrome.tabs.create({
      url,
    });
  };

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
