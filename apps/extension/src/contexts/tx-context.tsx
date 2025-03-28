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
import { formatErrorMsg, formatObjectWithBigInt } from '@/utils/format';

export enum TxRequestTypeEn {
  DeployWallet = 1,
  SendTransaction,
  ApproveTransaction,
}

type ITxContext = {
  // Tx/UserOp type
  requestType: Nullable<TxRequestTypeEn>;
  historyType: Nullable<HistoricalActivityTypeEn>;

  // UI
  isPacking: boolean;
  isSending: boolean;
  hasSufficientBalance: boolean;
  errorMsg: Nullable<string>;
  // UserOp/Tx info
  userOp: Nullable<ElytroUserOperation>;
  calcResult: Nullable<TUserOperationPreFundResult>;
  decodedDetail: Nullable<DecodeResult>;

  // Actions
  handleTxRequest: (
    requestType: TxRequestTypeEn,
    params?: Transaction[]
  ) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
};

const TxContext = createContext<ITxContext>({
  requestType: null,
  historyType: null,
  isPacking: true,
  isSending: false,
  hasSufficientBalance: false,
  errorMsg: null,
  userOp: null,
  calcResult: null,
  decodedDetail: null,
  handleTxRequest: () => {},
  onConfirm: () => {},
  onCancel: () => {},
  onRetry: () => {},
});

export const TxProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const { approval, resolve, reject } = useApproval();

  const userOpRef = useRef<Nullable<ElytroUserOperation>>();
  const txTypeRef = useRef<Nullable<HistoricalActivityTypeEn>>(null);
  const txParamsRef = useRef<Nullable<Transaction[]>>(null);

  const [requestType, setRequestType] =
    useState<Nullable<TxRequestTypeEn>>(null);
  const [isPacking, setIsPacking] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<Nullable<string>>(null);

  const [decodedDetail, setDecodedDetail] =
    useState<Nullable<DecodeResult>>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [calcResult, setCalcResult] =
    useState<Nullable<TUserOperationPreFundResult>>(null);

  const handleTxRequest = async (
    type: TxRequestTypeEn,
    params?: Transaction[]
  ) => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.TxConfirm, {
      fromAppCall: type === TxRequestTypeEn.ApproveTransaction ? '1' : '0',
    });

    packUserOp(type, params);
  };

  const getTxType = (type: TxRequestTypeEn) => {
    switch (type) {
      case TxRequestTypeEn.DeployWallet:
        return HistoricalActivityTypeEn.ActivateAccount;
      case TxRequestTypeEn.SendTransaction:
        return HistoricalActivityTypeEn.Send;
      default:
        return HistoricalActivityTypeEn.ContractInteraction;
    }
  };

  const generateDeployUserOp = async () => {
    const userOp = await wallet.createDeployUserOp();
    return await wallet.estimateGas(userOp);
  };

  const generateTxUserOp = async () => {
    if (!txParamsRef.current) {
      throw new Error('Invalid user operation');
    }

    return await wallet.createTxUserOp(txParamsRef.current);
  };

  const packUserOp = async (type: TxRequestTypeEn, params?: Transaction[]) => {
    try {
      setIsPacking(true);
      setRequestType(type);
      txParamsRef.current = params;
      txTypeRef.current = getTxType(type);

      let transferAmount = 0n;
      let currentUserOp: ElytroUserOperation;

      if (type === TxRequestTypeEn.DeployWallet) {
        currentUserOp = await generateDeployUserOp();
      } else {
        currentUserOp = await generateTxUserOp();
        const decodeRes = (await wallet.decodeUserOp(currentUserOp))?.[0];
        if (!decodeRes) {
          throw new Error('Failed to decode user operation');
        }
        transferAmount = BigInt(decodeRes.value); // hex to bigint
        setDecodedDetail(decodeRes);
      }

      const packedUserOp = await wallet.packUserOp(
        currentUserOp,
        toHex(transferAmount)
      );

      userOpRef.current = packedUserOp.userOp;
      setCalcResult(packedUserOp.calcResult);
      setHasSufficientBalance(!packedUserOp.calcResult.needDeposit);
    } catch (err) {
      const msg = formatErrorMsg(err);
      setErrorMsg(msg);
      toast({
        title: 'Failed to pack user operation',
        variant: 'destructive',
        description: msg,
      });
    } finally {
      setIsPacking(false);
    }
  };

  const resetTxContext = () => {
    setRequestType(null);
    setDecodedDetail(null);
    setHasSufficientBalance(false);
    setIsPacking(true);
    setCalcResult(null);
    txTypeRef.current = null;
    txParamsRef.current = null;
    userOpRef.current = null;
  };

  const onSendSuccess = async (
    opHash: string,
    currentUserOp: ElytroUserOperation,
    txHash?: string
  ) => {
    wallet.addNewHistory({
      type: txTypeRef.current!,
      opHash,
      txHash,
      userOp: currentUserOp!,
      decodedDetail: decodedDetail!,
    });

    if (requestType === TxRequestTypeEn.ApproveTransaction) {
      resolve(txHash);
    }
    resetTxContext();
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, {
      activating: requestType === TxRequestTypeEn.DeployWallet ? '1' : '0',
    });
  };

  const onConfirm = async () => {
    try {
      setIsSending(true);

      let currentUserOp = userOpRef.current;

      // TODO: check this logic
      if (!currentUserOp?.paymaster) {
        currentUserOp = await wallet.estimateGas(currentUserOp!);
      }

      const { signature, opHash } = await wallet.signUserOperation(
        formatObjectWithBigInt(currentUserOp!)
      );

      currentUserOp!.signature = signature;

      // const simulationResult =
      //   await elytroSDK.simulateUserOperation(currentUserOp);
      // const txDetail = formatSimulationResultToTxDetail(simulationResult);

      const { txHash, opHash: txOpHash } = await wallet.sendUserOperation(
        currentUserOp!,
        opHash
      );

      onSendSuccess(txOpHash, currentUserOp!, txHash);
    } catch (error) {
      const msg = formatErrorMsg(error);
      setErrorMsg(msg);
      toast({
        title: 'Failed to send transaction',
        description: msg,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToDashboard = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  const onCancel = () => {
    if (requestType === TxRequestTypeEn.ApproveTransaction && !isSending) {
      reject();
    }
    resetTxContext();
    if (history.length > 1) {
      history.back();
    } else {
      handleBackToDashboard();
    }
  };

  const onRetry = () => {
    if (!requestType || !txParamsRef.current) {
      toast({
        title: 'Failed to retry',
        description: 'Invalid request type or transaction parameters',
      });
      return;
    }

    setErrorMsg(null);
    packUserOp(requestType!, txParamsRef.current);
  };

  useEffect(() => {
    console.log('approval test', approval);
    const txInfo = approval?.data?.tx as Transaction[];
    if (txInfo?.[0]) {
      const type =
        !txInfo[0].data || txInfo[0].data === '0x'
          ? TxRequestTypeEn.SendTransaction
          : TxRequestTypeEn.ApproveTransaction;

      packUserOp(type, txInfo);
    }
  }, [approval]);

  return (
    <TxContext.Provider
      value={{
        userOp: userOpRef.current,
        historyType: txTypeRef.current,
        requestType,
        isPacking,
        isSending,
        hasSufficientBalance,
        errorMsg,
        calcResult,
        decodedDetail,
        handleTxRequest,
        onConfirm,
        onCancel,
        onRetry,
      }}
    >
      {children}
    </TxContext.Provider>
  );
};

export const useTx = () => useContext(TxContext);
