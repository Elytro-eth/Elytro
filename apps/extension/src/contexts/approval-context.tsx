import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { ApprovalTypeEn } from '@/constants/operations';
import { navigateTo } from '@/utils/navigation';
import { useInterval } from 'usehooks-ts';
import { useHashLocation } from 'wouter/use-hash-location';
import { EVENT_TYPES } from '@/constants/events';
import { RuntimeMessage } from '@/utils/message';
import { getCurrentSearchParams } from '@/utils/url';

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
    if (isApprovalProcessing.current) {
      return;
    }

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
        isApprovalProcessing.current = false;
      } else if (!newApproval && approval) {
        setApproval(null);
        isApprovalProcessing.current = false;
      }
    } catch (error) {
      console.error(error);
      setApproval(null);
      isApprovalProcessing.current = false;
    }
  };

  const onApprovalChanged = async () => {
    if (approval) {
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
              reason: 'Please activate your account first.',
            },
          } as TApprovalData,
        });
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Alert);
        return;
      }
      navigateTo('side-panel', approval.type);
    } else if (APPROVAL_ROUTES.includes(pathname as SafeAny)) {
      if (
        pathname === SIDE_PANEL_ROUTE_PATHS.TxConfirm &&
        getCurrentSearchParams('fromAppCall') === '0'
      ) {
        return; // internal send tx
      }
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
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
    if (!approval || isApprovalProcessing.current) {
      return;
    }
    try {
      await wallet.resolveApproval(approval.id, data);
      setApproval(null);
      isApprovalProcessing.current = false;
    } catch (error) {
      console.error(error);
    }
  };

  const reject = async (e?: Error) => {
    if (isApprovalProcessing.current || !approval) {
      return;
    }

    try {
      await wallet.rejectApproval(approval.id, e);
      setApproval(null);
      isApprovalProcessing.current = false;
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
