import { elytroSDK } from '@/background/services/sdk';
import { create } from 'zustand';
import useDialogStore from './dialog';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/entries/side-panel/routes';
import accountManager from '@/background/services/accountManager';
import _omit from 'lodash/omit';

interface ActivateState {
  calcResult: Nullable<TUserOperationPreFundResult>;
  deployUserOp: ElytroUserOperation | null;
  createDeployUserOp: (account: TAccountInfo) => Promise<void>;
  calculateDeployUserOp: (
    userOp: ElytroUserOperation
  ) => Promise<TUserOperationPreFundResult | undefined>;
  isCalculating: boolean;
}

const useActivateStore = create<ActivateState>((set, get) => ({
  deployUserOp: null,
  calcResult: null,
  isCalculating: false,
  async calculateDeployUserOp(userOp: ElytroUserOperation) {
    if (get().isCalculating) {
      return;
    }

    try {
      set({ isCalculating: true });
      const res = await elytroSDK.getRechargeAmountForUserOp(userOp, 0n);
      set({ calcResult: res });
      return res;
    } catch (error) {
      console.error(error);
    } finally {
      set({ isCalculating: false });
    }
  },
  async createDeployUserOp(account: TAccountInfo) {
    const deployUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(
      account.ownerAddress as string
    );
    await elytroSDK.estimateGas(deployUserOp);
    const calcResult = await get().calculateDeployUserOp(deployUserOp);

    if (calcResult && !calcResult?.needDeposit) {
      // if no need to deposit, directly open sign tx dialog
      useDialogStore.getState().openSignTxDialog(
        deployUserOp,
        () => {
          accountManager.updateAccount({
            ..._omit(account, 'balance'),
            isActivated: true,
          });
          navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, {
            activating: '1',
          });
        },
        'Activate account'
      );
    } else {
      set({ deployUserOp });
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Activate);
    }
  },
}));

export default useActivateStore;
