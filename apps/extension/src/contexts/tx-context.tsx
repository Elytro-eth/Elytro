import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { DecodeResult } from '@elytro/decoder';
import type { Transaction } from '@elytro/sdk';
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
import { getApproveErc20Tx, hasApprove } from '@/utils/tokenApproval';
import { TokenQuote } from '@/types/pimlico';
import { useChain } from './chain-context';
import { THookError } from '@/types/securityHook';

export enum TxRequestTypeEn {
  DeployWallet = 1,
  SendTransaction,
  ApproveTransaction,
  UpgradeContract,
}

type TMyDecodeResult = Pick<DecodeResult, 'method' | 'toInfo' | 'to'>;

type TTxMeta = {
  // Set when confirming private-mode recovery contacts update
  privateRecovery?: boolean;
  // no hook sign with 2FA
  noHookSignWith2FA?: boolean;
};

type ITxContext = {
  // Tx/UserOp type
  requestType: Nullable<TxRequestTypeEn>;
  historyType: Nullable<HistoricalActivityTypeEn>;

  // UI
  isPreparing: boolean; // Renamed from isPacking - now just for initial preparation
  isSending: boolean; // Now covers both pack + send
  hasSufficientBalance: boolean;
  errorMsg: Nullable<string>;
  hookError: Nullable<THookError>;

  // UserOp/Tx info
  userOp: Nullable<ElytroUserOperation>;
  calcResult: Nullable<TUserOperationPreFundResult>;
  decodedDetail: Nullable<DecodeResult[]>;
  useStablecoin?: Nullable<string>;
  estimatedCost: Nullable<{ gasCostUSD: string; gasCostNative: string }>; // For fast preview

  // Actions
  handleTxRequest: (
    requestType: TxRequestTypeEn,
    params?: Transaction[],
    innerDecodedDetail?: TMyDecodeResult,
    meta?: TTxMeta
  ) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: (noSponsor?: boolean, gasToken?: TokenQuote) => void;
  requestSecurityOtp: () => Promise<void>;
  verifySecurityOtp: (otpCode: string) => Promise<{
    challengeId: string;
    status: string;
    verifiedAt: string;
  }>;
};

const ConfirmSuccessMessageMap = {
  [TxRequestTypeEn.DeployWallet]: 'Activate wallet successfully',
  [TxRequestTypeEn.SendTransaction]: 'Transaction sent successfully',
  [TxRequestTypeEn.ApproveTransaction]: 'Transaction sent successfully',
  [TxRequestTypeEn.UpgradeContract]: 'Contract updated successfully',
};

const TxContext = createContext<ITxContext>({
  hookError: null,
  requestType: null,
  historyType: null,
  isPreparing: false,
  isSending: false,
  hasSufficientBalance: false,
  errorMsg: null,
  userOp: null,
  calcResult: null,
  decodedDetail: null,
  useStablecoin: null,
  estimatedCost: null,
  handleTxRequest: () => {},
  onConfirm: () => {},
  onCancel: () => {},
  onRetry: () => {},
  requestSecurityOtp: () => Promise.resolve(),
  verifySecurityOtp: () => Promise.resolve({ challengeId: '', status: '', verifiedAt: '' }),
});

export const TxProvider = ({ children }: { children: React.ReactNode }) => {
  const { wallet } = useWallet();
  const [hookError, setHookError] = useState<Nullable<THookError>>(null);
  const { approval, reject, resolve } = useApproval();
  const {
    reloadAccount,
    currentAccount: { address },
  } = useAccount();
  const { currentChain } = useChain();

  const userOpRef = useRef<Nullable<ElytroUserOperation>>();
  const txTypeRef = useRef<Nullable<HistoricalActivityTypeEn>>(null);
  const txParamsRef = useRef<Nullable<Transaction[]>>(null);
  const txDecodedDetailRef = useRef<TMyDecodeResult>();
  const txMetaRef = useRef<TTxMeta>();

  const [requestType, setRequestType] = useState<Nullable<TxRequestTypeEn>>(null);
  const [isPreparing, setIsPreparing] = useState(false); // Changed from isPacking
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<Nullable<string>>(null);

  const [decodedDetail, setDecodedDetail] = useState<Nullable<DecodeResult[]>>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [calcResult, setCalcResult] = useState<Nullable<TUserOperationPreFundResult>>(null);
  const [useStablecoin, setUseStablecoin] = useState<Nullable<string>>('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');
  const [estimatedCost, setEstimatedCost] = useState<Nullable<{ gasCostUSD: string; gasCostNative: string }>>(null);

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

          // Additional success hooks
          if (txMetaRef.current?.privateRecovery) {
            // Notify UI to show dialog instead of toast
            RuntimeMessage.sendMessage(EVENT_TYPES.UI.PRIVATE_RECOVERY_READY);
          }
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

  const handleTxRequest = async (
    type: TxRequestTypeEn,
    params?: Transaction[],
    decodedDetail?: TMyDecodeResult,
    meta?: TTxMeta
  ) => {
    console.log('test: meta', meta);
    txMetaRef.current = meta;
    // Use prepare for fast preview (estimation only)
    prepareUserOp(type, { params, decodedDetail });
  };

  const getTxType = (type: TxRequestTypeEn) => {
    switch (type) {
      case TxRequestTypeEn.DeployWallet:
        return HistoricalActivityTypeEn.ActivateAccount;
      case TxRequestTypeEn.SendTransaction:
        return HistoricalActivityTypeEn.Send;
      default:
        return HistoricalActivityTypeEn.ContractInteract;
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

  const prepareUserOp = async (
    type: TxRequestTypeEn,
    {
      params,
      decodedDetail,
    }: {
      params?: Transaction[];
      decodedDetail?: TMyDecodeResult;
    }
  ) => {
    try {
      setIsPreparing(true);
      setRequestType(type);
      txDecodedDetailRef.current = decodedDetail;
      txParamsRef.current = params;
      txTypeRef.current = getTxType(type);

      if (type === TxRequestTypeEn.DeployWallet) {
        setDecodedDetail([]);
        setEstimatedCost({
          gasCostUSD: '~0.50',
          gasCostNative: '~0.0001',
        });
        setHasSufficientBalance(true);
      } else {
        const { decodedDetail: decoded, estimatedCost } = await wallet.prepareUserOpEstimate(params!);

        if (txDecodedDetailRef.current) {
          decoded[decoded.length - 1] = {
            ...decoded[decoded.length - 1],
            ...txDecodedDetailRef.current,
          };
        }

        setDecodedDetail(decoded);
        setEstimatedCost(estimatedCost);
        setHasSufficientBalance(true);
      }
    } catch (err) {
      const msg = formatErrorMsg(err);
      setErrorMsg(msg);
      toast({
        title: 'Failed to prepare transaction',
        variant: 'destructive',
        description: msg,
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const packUserOp = async (
    type: TxRequestTypeEn,
    {
      params,
      decodedDetail,
      noSponsor = false,
      gasToken,
    }: {
      params?: Transaction[];
      decodedDetail?: TMyDecodeResult;
      noSponsor?: boolean;
      gasToken?: TokenQuote;
    }
  ) => {
    try {
      setIsSending(true);
      setRequestType(type);
      setUseStablecoin(gasToken ? gasToken.token : null);
      txDecodedDetailRef.current = decodedDetail;

      if (gasToken && address && currentChain) {
        await hasApprove(gasToken.token, gasToken.paymaster, address, currentChain);
      }

      txParamsRef.current = gasToken
        ? [getApproveErc20Tx(gasToken.token as `0x${string}`, gasToken.paymaster as `0x${string}`), ...(params || [])]
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

      const packedUserOp = await wallet.packUserOp(currentUserOp, toHex(transferAmount), noSponsor, gasToken);

      userOpRef.current = packedUserOp.userOp;
      setCalcResult(packedUserOp.calcResult);
    } catch (err) {
      const msg = formatErrorMsg(err);

      if (msg.endsWith('0x7939f424')) {
        setErrorMsg("You don't have sufficient funds for network cost, please deposit more");
      } else {
        setErrorMsg(msg);
      }
      toast({
        title: 'Failed to pack user operation',
        variant: 'destructive',
        description: msg,
      });
    } finally {
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    setHasSufficientBalance(!calcResult?.needDeposit);
  }, [calcResult?.needDeposit]);

  const resetTxContext = () => {
    setRequestType(null);
    setDecodedDetail(null);
    setHasSufficientBalance(false);
    setIsPreparing(false); // Reset to false
    setCalcResult(null);
    setErrorMsg(null);
    setEstimatedCost(null);
    txTypeRef.current = null;
    txParamsRef.current = null;
    txDecodedDetailRef.current = undefined;
    userOpRef.current = null;
    txMetaRef.current = undefined;
    console.log('test: resetTxContext');
  };

  const handleBack = (isCancel = false) => {
    const prevType = requestType;
    const wasExternalRequest = !!approval;
    resetTxContext();

    if (wasExternalRequest) {
      return;
    }

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

  const onRetry = (noSponsor = false, gasToken?: TokenQuote) => {
    if (!requestType) {
      toast({
        title: 'Invalid request type or transaction parameters',
        // description: 'Invalid request type or transaction parameters',
        variant: 'destructive',
      });
      return;
    }

    if (noSponsor === false) {
      gasToken = undefined;
    }

    setErrorMsg(null);
    packUserOp(requestType!, {
      params: txParamsRef.current as unknown as Transaction[],
      noSponsor,
      gasToken,
      decodedDetail: txDecodedDetailRef.current,
    });
  };

  const onConfirm = async () => {
    try {
      setIsSending(true);

      let currentUserOp: ElytroUserOperation;
      let transferAmount = 0n;

      if (requestType === TxRequestTypeEn.DeployWallet) {
        currentUserOp = await generateDeployUserOp();
      } else {
        currentUserOp = await generateTxUserOp();
        let decodeRes = await wallet.decodeUserOp(currentUserOp);
        if (!decodeRes || decodeRes.length === 0) {
          throw new Error('Failed to decode user operation');
        }

        transferAmount = decodeRes.reduce((acc: bigint, curr: DecodeResult) => acc + BigInt(curr.value), 0n);

        // Update decoded detail if needed (for SendTransaction type)
        if (requestType === TxRequestTypeEn.SendTransaction && txDecodedDetailRef.current) {
          decodeRes = [
            {
              ...decodeRes[decodeRes.length - 1],
              ...txDecodedDetailRef.current,
            },
          ];
        }

        setDecodedDetail(decodeRes);
      }

      const packedUserOp = await wallet.packUserOp(currentUserOp, toHex(transferAmount), false);
      const userOp = packedUserOp.userOp;
      userOpRef.current = userOp;
      setCalcResult(packedUserOp.calcResult);

      console.log('test: onConfirm txMetaRef.current?.noHookSignWith2FA', txMetaRef.current?.noHookSignWith2FA);
      const res = await wallet.sendUserOperation(userOp, txMetaRef.current?.noHookSignWith2FA);

      if ((res as SafeAny)?.code) {
        setHookError(res as THookError);
      } else {
        const opHash = res as string;
        setHookError(null);
        registerOpStatusListener(opHash);
        wallet.addNewHistory({
          type: txTypeRef.current!,
          opHash,
          from: userOp.sender,
          decodedDetail: decodedDetail!,
          approvalId: approval?.id,
        });
        resolve();
        handleBack();
      }
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

      // Use prepare for fast preview (same as internal flow)
      prepareUserOp(type, { params: txInfo });
    }
  }, [approval]);

  const requestSecurityOtp = async () => {
    try {
      const res = await wallet.requestSecurityOtp(userOpRef.current!);
      setHookError({
        code: 'OTP_REQUIRED',
        challengeId: res.challengeId,
        maskedEmail: res.maskedEmail,
        otpExpiresAt: res.otpExpiresAt,
      });
    } catch (error) {
      console.log('Elytro: requestSecurityOtp failed', error);
    }
  };

  const verifySecurityOtp = async (otpCode: string) => {
    try {
      if (!hookError?.challengeId) {
        throw new Error('Challenge ID is required');
      }
      const res = await wallet.verifyOTP(hookError.challengeId, otpCode);
      if (res.status === 'VERIFIED') {
        onConfirm();
      }
      return res;
    } catch (error) {
      setHookError(error as THookError);
      throw error;
    }
  };

  return (
    <TxContext.Provider
      value={{
        userOp: userOpRef.current,
        historyType: txTypeRef.current,
        requestType,
        isPreparing,
        isSending,
        hasSufficientBalance,
        errorMsg,
        calcResult,
        decodedDetail,
        useStablecoin,
        estimatedCost,
        handleTxRequest,
        onConfirm,
        onCancel,
        onRetry,
        hookError,
        requestSecurityOtp,
        verifySecurityOtp,
      }}
    >
      {children}
    </TxContext.Provider>
  );
};

export const useTx = () => useContext(TxContext);
