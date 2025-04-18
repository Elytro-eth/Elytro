import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { ApprovalTypeEn } from '@/constants/operations';
import { navigateTo } from '@/utils/navigation';
import { useInterval } from 'usehooks-ts';
import { useHashLocation } from 'wouter/use-hash-location';
import { EVENT_TYPES } from '@/constants/events';
import { RuntimeMessage } from '@/utils/message';

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

export const ApprovalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wallet } = useWallet();
  const [approval, setApproval] = useState<Nullable<TApprovalInfo>>(null);
  const [pathname] = useHashLocation();
  const isApprovalProcessing = useRef(false);

  const getCurrentApproval = async () => {
    try {
      const isLocked = await wallet.getLockStatus();
      if (isLocked) {
        return;
      }
      const newApproval = await wallet.getCurrentApproval();

      if (
        (newApproval && !approval) ||
        (newApproval && approval && newApproval.id !== approval.id)
      ) {
        setApproval(newApproval);
      } else if (!newApproval && approval) {
        setApproval(null);
      }
    } catch (error) {
      console.error(error);
      setApproval(null);
    }
  };

  const onApprovalChanged = async () => {
    if (!approval) {
      isApprovalProcessing.current = false;

      // Only approval routes can be redirected based on need
      if (APPROVAL_ROUTES.includes(pathname as ApprovalTypeEn)) {
        if (pathname === SIDE_PANEL_ROUTE_PATHS.TxConfirm) {
          return; // internal send tx
        }
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
      }
    } else if (!isApprovalProcessing.current && approval.type !== pathname) {
      isApprovalProcessing.current = true;

      const currentAccount = await wallet.getCurrentAccount();
      if (
        !currentAccount?.isDeployed &&
        approval.type !== ApprovalTypeEn.Alert
      ) {
        setApproval({
          ...approval,
          type: ApprovalTypeEn.Alert,
          data: {
            ...approval?.data,
            options: {
              name: 'wallet rpc',
              reason: 'Please activate your wallet first.',
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
    RuntimeMessage.onMessage(
      EVENT_TYPES.APPROVAL.REQUESTED,
      getCurrentApproval
    );
    return () => {
      RuntimeMessage.offMessage(getCurrentApproval);
    };
  }, []);

  const resolve = async (data: unknown) => {
    if (!approval) {
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
      await wallet.rejectApproval(approval.id, e);
      setApproval(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ApprovalContext.Provider value={{ approval, resolve, reject }}>
      {children}
    </ApprovalContext.Provider>
  );
};

export const useApproval = () => {
  return useContext(ApprovalContext);
};
