import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { navigateTo } from '@/utils/navigation';
import { DecodeResult } from '@elytro/decoder';
import type { Transaction } from '@elytro/sdk';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { useApproval } from './approval-context';
import { HistoricalActivityTypeEn, UserOperationStatusEn } from '@/constants/operations';
import { formatErrorMsg } from '@/utils/format';
import { RuntimeMessage } from '@/utils/message';
import { EVENT_TYPES } from '@/constants/events';
import { useAccount } from './account-context';
import { TABS_KEYS } from '@/components/biz/DashboardTabs';
import { TokenQuote } from '@/types/pimlico';
import { THookError } from '@/types/securityHook';

export enum TxRequestTypeEn {
  DeployWallet = 1,
  SendTransaction,
  ApproveTransaction,
  UpgradeContract,
}

type TMyDecodeResult = Pick<DecodeResult, 'method' | 'toInfo' | 'to'>;

type TTxMeta = {
  privateRecovery?: boolean;
  noHookSignWith2FA?: boolean;
  data?: Record<string, SafeAny>;
};

type ITxContext = {
  // Tx/UserOp type
  requestType: Nullable<TxRequestTypeEn>;
  historyType: Nullable<HistoricalActivityTypeEn>;

  // UI
  isPreparing: boolean;
  isSending: boolean;
  hasSufficientBalance: boolean;
  errorMsg: Nullable<string>;
  hookError: Nullable<THookError>;

  // UserOp/Tx info
  chosenGasToken: Nullable<TokenQuote>;
  costResult: Nullable<TUserOperationPreFundResult>;
  decodedDetail: Nullable<DecodeResult[]>;

  // New: Gas options
  gasOptions: GasOptionEstimate[];
  gasPaymentOption: GasPaymentOption;

  // Actions
  handleTxRequest: (requestType: TxRequestTypeEn, params?: Transaction[], meta?: TTxMeta) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: (noSponsor?: boolean, gasToken?: TokenQuote) => void;
  onGasOptionChange: (option: GasPaymentOption) => void; // New
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
  costResult: null,
  decodedDetail: null,
  chosenGasToken: null,
  gasOptions: [],
  gasPaymentOption: { type: 'self' },
  handleTxRequest: () => {},
  onConfirm: () => {},
  onCancel: () => {},
  onRetry: () => {},
  onGasOptionChange: () => {},
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

  const txTypeRef = useRef<Nullable<HistoricalActivityTypeEn>>(null);
  const txParamsRef = useRef<Nullable<Transaction[]>>(null);
  const txDecodedDetailRef = useRef<TMyDecodeResult>();
  const txMetaRef = useRef<TTxMeta>();
  const userOpRef = useRef<Nullable<ElytroUserOperation>>(); // real UserOp to send to chain

  const [requestType, setRequestType] = useState<Nullable<TxRequestTypeEn>>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<Nullable<string>>(null);

  const [decodedDetail, setDecodedDetail] = useState<Nullable<DecodeResult[]>>(null);
  const [chosenGasToken, setChosenGasToken] = useState<TokenQuote | undefined>(undefined);
  const [costResult, setCostResult] = useState<Nullable<TUserOperationPreFundResult>>(null);
  const hasSufficientBalance = !costResult?.needDeposit;

  const [gasOptions, setGasOptions] = useState<GasOptionEstimate[]>([]);
  const [gasPaymentOption, setGasPaymentOption] = useState<GasPaymentOption>({ type: 'self' });

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

  const handleTxRequest = async (type: TxRequestTypeEn, params?: Transaction[], meta?: TTxMeta) => {
    setRequestType(type);
    txMetaRef.current = meta;
    txTypeRef.current = getHistoryType(type);
    txParamsRef.current = params;
    prepareUserOp(type);
  };

  const getHistoryType = (type: TxRequestTypeEn) => {
    switch (type) {
      case TxRequestTypeEn.DeployWallet:
        return HistoricalActivityTypeEn.ActivateAccount;
      case TxRequestTypeEn.SendTransaction:
        return HistoricalActivityTypeEn.Send;
      default:
        return HistoricalActivityTypeEn.ContractInteract;
    }
  };

  // const generateDeployUserOp = async () => {
  //   const userOp = await wallet.createDeployUserOp();
  //   return await wallet.estimateGas(userOp);
  // };

  // const generateTxUserOp = async () => {
  //   if (!txParamsRef.current) {
  //     throw new Error('Invalid user operation');
  //   }

  //   return await wallet.createTxUserOp(txParamsRef.current);
  // };

  const prepareUserOp = async (type: TxRequestTypeEn) => {
    try {
      setIsPreparing(true);
      setRequestType(type);

      // Remove ERC20 approval logic - handled differently now
      const result = await wallet.prepareUserOp({
        params: txParamsRef.current as unknown as Transaction[],
      });

      setDecodedDetail(result.decodedRes);
      setGasOptions(result.gasOptions);
      setGasPaymentOption(result.defaultOption);

      // Set initial cost display from default option
      const defaultEstimate = result.gasOptions.find(
        (opt) => JSON.stringify(opt.option) === JSON.stringify(result.defaultOption)
      );

      if (defaultEstimate) {
        setCostResult({
          gasUsed: defaultEstimate.gasUsed,
          needDeposit: defaultEstimate.needDeposit,
          hasSponsored: defaultEstimate.option.type === 'sponsor',
          balance: defaultEstimate.balance || 0n,
          suspiciousOp: false,
        });
      }
    } catch (err) {
      console.log('test: prepareUserOp error', err);
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

  const handleGasOptionChange = (option: GasPaymentOption) => {
    setGasPaymentOption(option);

    const estimate = gasOptions.find((opt) => JSON.stringify(opt.option) === JSON.stringify(option));

    if (estimate) {
      setCostResult({
        gasUsed: estimate.gasUsed,
        needDeposit: estimate.needDeposit,
        hasSponsored: estimate.option.type === 'sponsor',
        balance: estimate.balance || 0n,
        suspiciousOp: false,
      });

      if (estimate.option.type === 'erc20') {
        setChosenGasToken(estimate.option.token);
      } else {
        setChosenGasToken(undefined);
      }
    }
  };

  // const packUserOp = async (
  //   type: TxRequestTypeEn,
  //   {
  //     params,
  //     decodedDetail,
  //     noSponsor = false,
  //     gasToken,
  //   }: {
  //     params?: Transaction[];
  //     decodedDetail?: TMyDecodeResult;
  //     noSponsor?: boolean;
  //     gasToken?: TokenQuote;
  //   }
  // ) => {
  //   try {
  //     setIsSending(true);
  //     setRequestType(type);
  //     setChosenGasToken(gasToken || undefined);
  //     txDecodedDetailRef.current = decodedDetail;

  //     if (gasToken && address && currentChain) {
  //       await hasApprove(gasToken.token, gasToken.paymaster, address, currentChain);
  //     }

  //     txParamsRef.current = gasToken
  //       ? [getApproveErc20Tx(gasToken.token as `0x${string}`, gasToken.paymaster as `0x${string}`), ...(params || [])]
  //       : params;
  //     txTypeRef.current = getHistoryType(type);

  //     let transferAmount = 0n;
  //     let currentUserOp: ElytroUserOperation;

  //     if (type === TxRequestTypeEn.DeployWallet) {
  //       currentUserOp = await generateDeployUserOp();
  //     } else {
  //       currentUserOp = await generateTxUserOp();
  //       let decodeRes = await wallet.decodeUserOp(currentUserOp);
  //       if (!decodeRes || decodeRes.length === 0) {
  //         throw new Error('Failed to decode user operation');
  //       }

  //       transferAmount = decodeRes.reduce((acc: bigint, curr: DecodeResult) => acc + BigInt(curr.value), 0n);

  //       if (type === TxRequestTypeEn.SendTransaction && txDecodedDetailRef.current) {
  //         decodeRes = [
  //           {
  //             ...decodeRes[decodeRes.length - 1],
  //             ...txDecodedDetailRef.current,
  //           },
  //         ];
  //       }

  //       setDecodedDetail(decodeRes);
  //     }

  //     const packedUserOp = await wallet.packUserOp(currentUserOp, toHex(transferAmount), noSponsor, gasToken);

  //     userOpRef.current = packedUserOp.userOp;
  //   } catch (err) {
  //     const msg = formatErrorMsg(err);

  //     if (msg.endsWith('0x7939f424')) {
  //       setErrorMsg("You don't have sufficient funds for network cost, please deposit more");
  //     } else {
  //       setErrorMsg(msg);
  //     }
  //     toast({
  //       title: 'Failed to pack user operation',
  //       variant: 'destructive',
  //       description: msg,
  //     });
  //   } finally {
  //     setIsPreparing(false);
  //   }
  // };

  const resetTxContext = () => {
    setRequestType(null);
    setDecodedDetail(null);
    setIsPreparing(false); // Reset to false
    setCostResult(null);
    setErrorMsg(null);
    setChosenGasToken(undefined);

    txTypeRef.current = null;
    txParamsRef.current = null;
    txDecodedDetailRef.current = undefined;
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

    if (params) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, params);
    }
  };

  const onCancel = async () => {
    if (!isSending) {
      await reject();
    }

    handleBack(true);
  };

  const onRetry = () => {
    if (!requestType) {
      toast({
        title: 'Invalid request type or transaction parameters',
        // description: 'Invalid request type or transaction parameters',
        variant: 'destructive',
      });
      return;
    }

    setErrorMsg(null);

    // prepareUserOp(requestType!);
  };

  const onConfirm = async () => {
    try {
      setIsSending(true);

      const res = await wallet.buildAndSendUserOp(
        txParamsRef.current || [],
        gasPaymentOption,
        txMetaRef.current?.noHookSignWith2FA
      );

      if ((res as SafeAny)?.code) {
        if ((res as SafeAny)?.code === 'OTP_REQUIRED') {
          setHookError(res as THookError);
        } else {
          setErrorMsg(formatErrorMsg(res as SafeAny));
        }
        userOpRef.current = (res as SafeAny)?.userOp;
      } else {
        const opHash = res as string;
        setHookError(null);
        registerOpStatusListener(opHash);

        const callId = approval?.data?.callId as string | undefined;
        if (callId) {
          wallet.updateEIP5792CallWithUserOpHash(callId, opHash).catch((error) => {
            console.error(`[EIP-5792] Error updating call ${callId}:`, error);
          });
        }

        wallet.addNewHistory({
          type: txTypeRef.current!,
          opHash,
          from: decodedDetail?.[0]?.from || address,
          decodedDetail: decodedDetail!,
          approvalId: approval?.id,
        });
        resolve();
        handleBack();

        setErrorMsg(null);
      }
    } catch (error) {
      const msg = formatErrorMsg(error);
      setErrorMsg(msg);

      const callId = approval?.data?.callId as string | undefined;
      if (callId) {
        wallet.failEIP5792Call(callId, msg).catch((error) => {
          console.error(`[EIP-5792] Error failing call ${callId}:`, error);
        });
      }

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

      handleTxRequest(type, txInfo);
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
      setIsSending(true);
      const res = await wallet.verifyOTP(hookError.challengeId, otpCode);
      if (res.status === 'VERIFIED') {
        setHookError(null);
        const sendRes = await wallet.sendUserOperation(userOpRef.current!);

        if ((sendRes as SafeAny)?.code) {
          setHookError(sendRes as THookError);
        } else {
          const opHash = sendRes as string;
          setHookError(null);
          registerOpStatusListener(opHash);

          const callId = approval?.data?.callId as string | undefined;
          if (callId) {
            wallet.updateEIP5792CallWithUserOpHash(callId, opHash).catch((error) => {
              console.error(`[EIP-5792] Error updating call ${callId}:`, error);
            });
          }

          wallet.addNewHistory({
            type: txTypeRef.current!,
            opHash,
            from: decodedDetail?.[0]?.from || address,
            decodedDetail: decodedDetail!,
            approvalId: approval?.id,
          });
          resolve();
          handleBack();
        }
      }
      return res;
    } catch (error) {
      setHookError(error as THookError);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TxContext.Provider
      value={{
        historyType: txTypeRef.current,
        requestType,
        isPreparing,
        isSending,
        hasSufficientBalance,
        errorMsg,
        costResult,
        decodedDetail,
        chosenGasToken,
        gasOptions, // New
        gasPaymentOption, // New
        handleTxRequest,
        onConfirm,
        onCancel,
        onRetry,
        onGasOptionChange: handleGasOptionChange, // New
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
