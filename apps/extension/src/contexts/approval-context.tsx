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

      const isApprovalRoute = APPROVAL_ROUTES.includes(pathname as ApprovalTypeEn);
      const isTxConfirmPage = pathname === SIDE_PANEL_ROUTE_PATHS.TxConfirm;

      if (isApprovalRoute && !isTxConfirmPage) {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
      return;
    }

    if (isProcessingApproval.current || approval.type === pathname) {
      return;
    }

    navigateTo('side-panel', approval.type);
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
