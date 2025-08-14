import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WalletController, WalletStatusEn } from '@/background/walletController';
import PortMessage from '@/utils/message/portMessage';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';
import { cn } from '@/utils/shadcn/utils';
import { useInterval } from 'usehooks-ts';
const portMessage = new PortMessage('elytro-ui');

const INIT_PATHS = [
  SIDE_PANEL_ROUTE_PATHS.Transfer,
  // SIDE_PANEL_ROUTE_PATHS.CreateAccount,
  SIDE_PANEL_ROUTE_PATHS.CreatePasscode,
  SIDE_PANEL_ROUTE_PATHS.YouAreIn,
  SIDE_PANEL_ROUTE_PATHS.AccountRecovery,
  SIDE_PANEL_ROUTE_PATHS.RetrieveContacts,
  SIDE_PANEL_ROUTE_PATHS.Home,
];

const walletControllerProxy = new Proxy(
  {},
  {
    get(_, prop: keyof WalletController) {
      return function (...args: unknown[]) {
        const random = Math.random();
        portMessage.sendMessage('UI_REQUEST', {
          method: prop,
          random,
          params: args,
        });

        return new Promise((resolve, reject) => {
          portMessage.onMessage(`UI_RESPONSE_${prop}_${random}`, (data) => {
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

type IWalletContext = {
  wallet: WalletController;
  status: WalletStatusEn | undefined;
};

const WalletContext = createContext<IWalletContext>({
  wallet: walletControllerProxy as WalletController,
  status: WalletStatusEn.NoOwner,
});

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<WalletStatusEn | undefined>();
  const [pathname] = useEnhancedHashLocation();
  // const [loading, setLoading] = useState(false);
  const isCheckingRef = useRef<boolean>(false);

  const getWalletStatus = async () => {
    try {
      // if (loading) {
      //   return;
      // }

      // setLoading(true);
      isCheckingRef.current = true;
      const res = await walletControllerProxy.getWalletStatus();

      // We should NOT navigate if user already in the home/dashboard page and the status is the same and the status is not in the list of statuses
      if (
        ![SIDE_PANEL_ROUTE_PATHS.Home, SIDE_PANEL_ROUTE_PATHS.Dashboard].includes(pathname as SidePanelRoutePath) &&
        res === status &&
        ![WalletStatusEn.HasOwnerButLocked, WalletStatusEn.HasAccountAndUnlocked].includes(res)
      ) {
        return;
      }

      let navigateToPath: SidePanelRoutePath | undefined;

      switch (res) {
        case WalletStatusEn.HasOwnerButLocked:
          navigateToPath = SIDE_PANEL_ROUTE_PATHS.Unlock;
          break;
        case WalletStatusEn.Recovering:
          navigateToPath = SIDE_PANEL_ROUTE_PATHS.RetrieveContacts;
          break;
        case WalletStatusEn.NoAccount || WalletStatusEn.NoOwner:
          if (!INIT_PATHS.includes(pathname as SidePanelRoutePath)) {
            navigateToPath = SIDE_PANEL_ROUTE_PATHS.Home;
          }
          break;
        case WalletStatusEn.HasAccountAndUnlocked:
          if (INIT_PATHS.includes(pathname as SidePanelRoutePath)) {
            navigateToPath = SIDE_PANEL_ROUTE_PATHS.Dashboard;
          }
          break;
        default:
          break;
      }

      setStatus(res);
      if (navigateToPath) {
        navigateTo('side-panel', navigateToPath);
      }
    } catch {
      toast({
        title: 'Failed to get wallet status, please try later',
        // description: 'Please try again later',
        variant: 'destructive',
      });
      setStatus(WalletStatusEn.NoOwner);
    } finally {
      // setLoading(false);
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    getWalletStatus();
  }, [walletControllerProxy, pathname]);

  useInterval(() => {
    getWalletStatus();
  }, 15_000);

  return (
    <WalletContext.Provider value={{ wallet: walletControllerProxy, status }}>
      <div
        className={cn(
          'flex flex-1 items-center justify-center relative'
          // loading && 'opacity-70 pointer-events-none'
        )}
      >
        {/* {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[4px] z-10">
            <Loader2 className="size-12 animate-spin text-primary" />
          </div>
        )} */}
        {children}
      </div>
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const { wallet, status } = useContext(WalletContext);

  return { wallet, status };
};
