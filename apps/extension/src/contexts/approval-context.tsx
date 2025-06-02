import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { ApprovalTypeEn } from '@/constants/operations';
import { navigateTo } from '@/utils/navigation';
import { useInterval } from 'usehooks-ts';
import { EVENT_TYPES } from '@/constants/events';
import { RuntimeMessage } from '@/utils/message';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';

type IApprovalContext = {
  approval: Nullable<TApprovalInfo>;
  resolve: (data?: unknown) => Promise<void>;
  reject: (e?: Error) => Promise<void>;
};

const ApprovalContext = createContext<IApprovalContext>({
  approval: null,
  resolve: async () => {},
  reject: async () => {},
});

const APPROVAL_ROUTES = Object.values(ApprovalTypeEn);

export const ApprovalProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const [approval, setApproval] = useState<Nullable<TApprovalInfo>>(null);
  const [pathname] = useEnhancedHashLocation();
  const isProcessingApproval = useRef(false);

  const getCurrentApproval = async () => {
    try {
      const isLocked = await wallet.getLockStatus();
      if (isLocked) {
        return;
      }
      const newApproval = await wallet.getCurrentApproval();
      const needUpdate = approval?.id !== newApproval?.id;

      if (needUpdate) {
        setApproval(newApproval);
      }
    } catch (error) {
      console.error(error);
      setApproval(null);
    }
  };

  const onApprovalChanged = async () => {
    if (!approval) {
      isProcessingApproval.current = false;

      if (APPROVAL_ROUTES.includes(pathname as ApprovalTypeEn)) {
        if (pathname === SIDE_PANEL_ROUTE_PATHS.TxConfirm) {
          return;
        }
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
    } else if (approval.type !== pathname && !isProcessingApproval.current) {
      const currentAccount = await wallet.getCurrentAccount();
      if (!currentAccount?.isDeployed && approval.type !== ApprovalTypeEn.Alert) {
        setApproval({
          ...approval,
          type: ApprovalTypeEn.Alert,
          data: {
            ...approval?.data,
            options: {
              name: 'Wallet RPC',
              reason: 'please activate your wallet first.',
            },
          } as TApprovalData,
        });
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Alert);
        return;
      }
      navigateTo('side-panel', approval.type);
      return;
    }
  };

  useEffect(() => {
    onApprovalChanged();
  }, [approval, pathname]);

  useInterval(() => {
    getCurrentApproval();
  }, 1_200);

  useEffect(() => {
    RuntimeMessage.onMessage(EVENT_TYPES.APPROVAL.REQUESTED, getCurrentApproval);
    return () => {
      RuntimeMessage.offMessage(getCurrentApproval);
    };
  }, []);

  const resolve = async (data?: unknown) => {
    if (!approval) {
      return;
    }

    if (approval.type === SIDE_PANEL_ROUTE_PATHS.TxConfirm) {
      // resolve approval is processed by service automatically, only need to set the approval to null
      isProcessingApproval.current = true;
      return;
    }

    try {
      await wallet.resolveApproval(approval.id, data);
      setApproval(null);
    } catch (error) {
      console.error(error);
    }
  };

  const reject = async (e?: Error) => {
    if (!approval) {
      return;
    }

    try {
      isProcessingApproval.current = true;

      await wallet.rejectApproval(approval.id, e);
      setApproval(null);
    } catch (error) {
      console.error(error);
    }
  };

  return <ApprovalContext.Provider value={{ approval, resolve, reject }}>{children}</ApprovalContext.Provider>;
};

export const useApproval = () => {
  return useContext(ApprovalContext);
};
