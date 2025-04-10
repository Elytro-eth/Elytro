import { createContext, useContext, useEffect, useState } from 'react';
import {
  WalletController,
  WalletStatusEn,
} from '@/background/walletController';
import PortMessage from '@/utils/message/portMessage';
import { Toast, toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';
import { RuntimeMessage } from '@/utils/message';
import { EVENT_TYPES } from '@/constants/events';

const portMessage = new PortMessage('elytro-ui');

const walletControllerProxy = new Proxy(
  {},
  {
    get(_, prop: keyof WalletController) {
      return function (...args: unknown[]) {
        portMessage.sendMessage('UI_REQUEST', {
          method: prop,
          params: args,
        });

        return new Promise((resolve, reject) => {
          portMessage.onMessage(`UI_RESPONSE_${prop}`, (data) => {
            if (data?.error) {
              reject(data?.error);
            } else {
              resolve(data?.result);
            }
          });
        });
      };
    },
  }
) as WalletController;

// App async toast event listener
RuntimeMessage.onMessage(EVENT_TYPES.UI.SHOW_TOAST, (data: Toast) => {
  toast(data);
});

type IWalletContext = {
  wallet: WalletController;
  status: WalletStatusEn;
};

const WalletContext = createContext<IWalletContext>({
  wallet: walletControllerProxy as WalletController,
  status: WalletStatusEn.NoOwner,
});

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<WalletStatusEn>(WalletStatusEn.NoOwner);
  const [pathname] = useEnhancedHashLocation();

  const getWalletStatus = async () => {
    try {
      const res = await walletControllerProxy.getWalletStatus();

      if (res === WalletStatusEn.HasAccountButLocked) {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
      setStatus(res);
    } catch {
      toast({
        title: 'Failed to get wallet status',
        description: 'Please try again later',
        variant: 'destructive',
      });
      setStatus(WalletStatusEn.NoOwner);
    }
  };

  useEffect(() => {
    getWalletStatus();
  }, [walletControllerProxy, pathname]);

  return (
    <WalletContext.Provider value={{ wallet: walletControllerProxy, status }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const { wallet, status } = useContext(WalletContext);

  return { wallet, status };
};
