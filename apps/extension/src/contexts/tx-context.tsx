import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { DecodeResult } from '@soulwallet/decoder';
import type { Transaction } from '@soulwallet/sdk';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toHex } from 'viem';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { useApproval } from './approval-context';
import { HistoricalActivityTypeEn, UserOperationStatusEn } from '@/constants/operations';
import { formatErrorMsg } from '@/utils/format';
import { RuntimeMessage } from '@/utils/message';
import { EVENT_TYPES } from '@/constants/events';
import { useAccount } from './account-context';
import { TABS_KEYS } from '@/components/biz/DashboardTabs';
import { getApproveErc20Tx } from '@/utils/tokenApproval';

export enum TxRequestTypeEn {
  DeployWallet = 1,
  SendTransaction,
  ApproveTransaction,
  UpgradeContract,
}

type TMyDecodeResult = Pick<DecodeResult, 'method' | 'toInfo' | 'to'>;

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
  decodedDetail: Nullable<DecodeResult[]>;
  useStablecoin?: Nullable<string>;

  // Actions
  handleTxRequest: (requestType: TxRequestTypeEn, params?: Transaction[], innerDecodedDetail?: TMyDecodeResult) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: (noSponsor?: boolean, paymaster?: TTokenPaymaster) => void;
};

const ConfirmSuccessMessageMap = {
  [TxRequestTypeEn.DeployWallet]: 'Activate wallet successfully',
  [TxRequestTypeEn.SendTransaction]: 'Transaction sent successfully',
  [TxRequestTypeEn.ApproveTransaction]: 'Transaction sent successfully',
  [TxRequestTypeEn.UpgradeContract]: 'Contract updated successfully',
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
  useStablecoin: null,
  handleTxRequest: () => {},
  onConfirm: () => {},
  onCancel: () => {},
  onRetry: () => {},
});

export const TxProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const { approval, reject, resolve } = useApproval();
  const {
    reloadAccount,
    tokenInfo: { tokens },
  } = useAccount();

  const userOpRef = useRef<Nullable<ElytroUserOperation>>();
  const txTypeRef = useRef<Nullable<HistoricalActivityTypeEn>>(null);
  const txParamsRef = useRef<Nullable<Transaction[]>>(null);
  const txDecodedDetailRef = useRef<TMyDecodeResult>();

  const [requestType, setRequestType] = useState<Nullable<TxRequestTypeEn>>(null);
  const [isPacking, setIsPacking] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<Nullable<string>>(null);

  const [decodedDetail, setDecodedDetail] = useState<Nullable<DecodeResult[]>>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [calcResult, setCalcResult] = useState<Nullable<TUserOperationPreFundResult>>(null);
  const [useStablecoin, setUseStablecoin] = useState<Nullable<string>>('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');

  const registerOpStatusListener = useCallback(
    (opHash: string) => {
      const eventKey = `${EVENT_TYPES.HISTORY.ITEM_STATUS_UPDATED}_${opHash}`;
      const listener = (message: SafeAny) => {
        if (message?.status === UserOperationStatusEn.confirmedSuccess) {
          reloadAccount(true);
          toast({
            title: ConfirmSuccessMessageMap[requestType!],
            variant: 'constructive',
          });
        } else {
          toast({
            title: 'Transaction failed, please try again',
            // description: 'Please try again',
            variant: 'destructive',
          });
        }
      };

      RuntimeMessage.onMessage(eventKey, listener);

      return () => {
        RuntimeMessage.offMessage(listener);
      };
    },
    [requestType]
  );

  const handleTxRequest = async (type: TxRequestTypeEn, params?: Transaction[], decodedDetail?: TMyDecodeResult) => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.TxConfirm);
    packUserOp(type, { params, decodedDetail });
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

  const packUserOp = async (
    type: TxRequestTypeEn,
    {
      params,
      decodedDetail,
      noSponsor = false,
      paymaster,
    }: {
      params?: Transaction[];
      decodedDetail?: TMyDecodeResult;
      noSponsor?: boolean;
      paymaster?: TTokenPaymaster;
    }
  ) => {
    try {
      setIsPacking(true);
      setRequestType(type);
      setUseStablecoin(paymaster ? paymaster.address : null);
      txDecodedDetailRef.current = decodedDetail;
      txParamsRef.current = paymaster
        ? [getApproveErc20Tx(paymaster.address, paymaster.paymaster), ...(params || [])]
        : params;
      txTypeRef.current = getTxType(type);

      let transferAmount = 0n;
      let currentUserOp: ElytroUserOperation;

      if (type === TxRequestTypeEn.DeployWallet) {
        currentUserOp = await generateDeployUserOp();
      } else {
        currentUserOp = await generateTxUserOp();
        let decodeRes = await wallet.decodeUserOp(currentUserOp);
        if (!decodeRes || decodeRes.length === 0) {
          throw new Error('Failed to decode user operation');
        }

        transferAmount = decodeRes.reduce((acc: bigint, curr: DecodeResult) => acc + BigInt(curr.value), 0n);

        if (type === TxRequestTypeEn.SendTransaction && txDecodedDetailRef.current) {
          decodeRes = [
            {
              ...decodeRes[decodeRes.length - 1],
              ...txDecodedDetailRef.current,
            },
          ];
        }

        setDecodedDetail(decodeRes);
      }

      const packedUserOp = await wallet.packUserOp(currentUserOp, toHex(transferAmount), noSponsor, paymaster?.address);

      userOpRef.current = packedUserOp.userOp;
      setCalcResult(packedUserOp.calcResult);
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

  useEffect(() => {
    if (useStablecoin) {
      const token = tokens.find((token) => token.address.toLowerCase() === useStablecoin.toLowerCase());
      setHasSufficientBalance(!!token && !!token.balance && token.balance > 1_000_000n);
    } else {
      setHasSufficientBalance(!calcResult?.needDeposit);
    }
  }, [calcResult?.needDeposit, useStablecoin, tokens]);

  const resetTxContext = () => {
    setRequestType(null);
    setDecodedDetail(null);
    setHasSufficientBalance(false);
    setIsPacking(true);
    setCalcResult(null);
    setErrorMsg(null);
    txTypeRef.current = null;
    txParamsRef.current = null;
    txDecodedDetailRef.current = undefined;
    userOpRef.current = null;
  };

  const handleBack = (isCancel = false) => {
    const prevType = requestType;
    resetTxContext();

    let params;
    if (!isCancel) {
      if (prevType === TxRequestTypeEn.DeployWallet || prevType === TxRequestTypeEn.UpgradeContract) {
        params = { activating: '1' };
      } else {
        params = { tab: TABS_KEYS.ACTIVITIES };
      }
    }

    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, params);
  };

  const onCancel = async () => {
    if (!isSending) {
      await reject();
    }

    handleBack(true);
  };

  const onRetry = (noSponsor = false, paymaster?: TTokenPaymaster) => {
    if (!requestType) {
      toast({
        title: 'Invalid request type or transaction parameters',
        // description: 'Invalid request type or transaction parameters',
        variant: 'destructive',
      });
      return;
    }

    setErrorMsg(null);
    packUserOp(requestType!, {
      params: txParamsRef.current as unknown as Transaction[],
      noSponsor,
      paymaster,
      decodedDetail: txDecodedDetailRef.current,
    });
  };

  const onConfirm = async () => {
    try {
      setIsSending(true);
      const opHash = await wallet.sendUserOperation(userOpRef.current!);
      registerOpStatusListener(opHash);
      wallet.addNewHistory({
        type: txTypeRef.current!,
        opHash,
        from: userOpRef.current!.sender,
        decodedDetail: decodedDetail!,
        approvalId: approval?.id,
      });
      resolve();
      handleBack();
    } catch (error) {
      const msg = formatErrorMsg(error);
      setErrorMsg(msg);
      toast({
        title: 'Failed to send transaction',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const txInfo = approval?.data?.tx as Transaction[];
    if (txInfo?.[0]) {
      const type =
        !txInfo[0].data || txInfo[0].data === '0x'
          ? TxRequestTypeEn.SendTransaction
          : TxRequestTypeEn.ApproveTransaction;

      packUserOp(type, { params: txInfo });
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
        useStablecoin,
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
