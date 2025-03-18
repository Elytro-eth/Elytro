import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { DecodeResult } from '@soulwallet/decoder';
import type { Transaction } from '@soulwallet/sdk';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toHex } from 'viem';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { useApproval } from './approval-context';
import { HistoricalActivityTypeEn } from '@/constants/operations';

export enum UserOpType {
  DeployWallet = 1,
  SendTransaction,
  ApproveTransaction,
}

// TODO: move approvals to tx-context. means that there is no isXXXTxVisible but which tx is open
type ITxContext = {
  opType: Nullable<UserOpType>;
  isPacking: boolean;
  hasSufficientBalance: boolean;
  userOp: Nullable<ElytroUserOperation>;
  calcResult: Nullable<TUserOperationPreFundResult>;
  decodedDetail: Nullable<DecodeResult>;
  txType: Nullable<HistoricalActivityTypeEn>;
  // TODO: params can be an array of transactions
  openUserOpConfirmTx: (opType: UserOpType, params?: Transaction[]) => void;
  closeUserOpConfirmTx: () => void;
};

const TxContext = createContext<ITxContext>({
  opType: null,
  isPacking: true,
  hasSufficientBalance: false,
  userOp: null,
  calcResult: null,
  decodedDetail: null,
  openUserOpConfirmTx: () => {},
  closeUserOpConfirmTx: () => {},
  txType: null,
});

// TODO: maybe move this to tx-confirm page?
export const TxProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const userOpRef = useRef<Nullable<ElytroUserOperation>>();
  const txTypeRef = useRef<Nullable<HistoricalActivityTypeEn>>(null);
  const { approval } = useApproval();

  const [opType, setOpType] = useState<Nullable<UserOpType>>(null);
  const [isPacking, setIsPacking] = useState(true);
  const [decodedDetail, setDecodedDetail] =
    useState<Nullable<DecodeResult>>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [calcResult, setCalcResult] =
    useState<Nullable<TUserOperationPreFundResult>>(null);

  const openUserOpConfirmTx = async (
    type: UserOpType,
    params?: Transaction[]
  ) => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.TxConfirm, {
      fromAppCall: type === UserOpType.ApproveTransaction ? '1' : '0',
    });
    packUserOp(type, params);
  };

  const closeUserOpConfirmTx = () => {
    setOpType(null);
    setDecodedDetail(null);
    setHasSufficientBalance(false);
    setIsPacking(false);
    setCalcResult(null);
    txTypeRef.current = null;
    userOpRef.current = null;
  };

  const getTxType = (type: UserOpType) => {
    switch (type) {
      case UserOpType.DeployWallet:
        return HistoricalActivityTypeEn.ActivateAccount;
      case UserOpType.SendTransaction:
        return HistoricalActivityTypeEn.Send;
      // TODO: no 'receive' tx type yet.
      default:
        return HistoricalActivityTypeEn.ContractInteraction;
    }
  };

  const packUserOp = async (type: UserOpType, params?: Transaction[]) => {
    try {
      setIsPacking(true);
      setOpType(type);

      let transferAmount = 0n;
      let currentUserOp: ElytroUserOperation;

      if (type === UserOpType.DeployWallet) {
        currentUserOp = await wallet.createDeployUserOp();
        currentUserOp = await wallet.estimateGas(currentUserOp);
      } else {
        if (!params) {
          throw new Error('Invalid user operation');
        }

        currentUserOp = await wallet.createTxUserOp(params);
        // TODO: use the first decoded result only. what if there are multiple decoded results?

        const decodeRes = (await wallet.decodeUserOp(currentUserOp))?.[0];

        if (!decodeRes) {
          throw new Error('Failed to decode user operation');
        }

        transferAmount = BigInt(decodeRes.value); // hex to bigint
        setDecodedDetail(decodeRes);
      }

      const res = await wallet.packUserOp(currentUserOp, toHex(transferAmount));

      userOpRef.current = res.userOp;
      setCalcResult(res.calcResult);
      setHasSufficientBalance(!res.calcResult.needDeposit);
      txTypeRef.current = getTxType(type);
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err) || 'Unknown Error';
      toast({
        title: 'Failed to pack user operation',
        variant: 'destructive',
        description: errMsg,
      });
      console.error(errMsg);
    } finally {
      setIsPacking(false);
    }
  };

  useEffect(() => {
    const txInfo = approval?.data?.tx as Transaction[];
    if (txInfo?.[0]) {
      const type =
        !txInfo[0].data || txInfo[0].data === '0x'
          ? UserOpType.SendTransaction
          : UserOpType.ApproveTransaction;

      packUserOp(type, txInfo);
    }
  }, [approval]);

  return (
    <TxContext.Provider
      value={{
        userOp: userOpRef.current,
        txType: txTypeRef.current,
        opType,
        isPacking,
        calcResult,
        hasSufficientBalance,
        decodedDetail,
        openUserOpConfirmTx,
        closeUserOpConfirmTx,
      }}
    >
      {children}
    </TxContext.Provider>
  );
};

export const useTx = () => {
  return useContext(TxContext);
};
