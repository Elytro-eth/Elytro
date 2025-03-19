import { useMemo, useState } from 'react';
import { UserOpType, useTx } from '@/contexts/tx-context';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { useApproval } from '@/contexts/approval-context';
import { useWallet } from '@/contexts/wallet';
import { formatObjectWithBigInt } from '@/utils/format';
import { toast } from '@/hooks/use-toast';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { useAccount } from '@/contexts/account-context';
const UserOpTitleMap = {
  [UserOpType.DeployWallet]: 'Activate account',
  [UserOpType.SendTransaction]: 'Send',
  [UserOpType.ApproveTransaction]: 'Confirm transaction',
};

export default function TxConfirm() {
  const { wallet } = useWallet();
  const {
    opType,
    txType,
    isPacking,
    hasSufficientBalance,
    userOp,
    calcResult,
    decodedDetail,
  } = useTx();
  const {
    currentAccount: { chainId },
  } = useAccount();
  const [isSending, setIsSending] = useState(false);
  const { reject, resolve } = useApproval();

  const renderContent = useMemo(() => {
    if (isPacking) return <ProcessingTip />;

    if (opType) {
      return (
        <UserOpDetail
          opType={opType}
          calcResult={calcResult}
          chainId={chainId!}
          decodedUserOp={decodedDetail}
          from={userOp?.sender}
        />
      );
    }

    // TODO: error tip
    return null;
  }, [isPacking, opType, calcResult, decodedDetail, chainId]);

  const handleCancel = () => {
    if (opType === UserOpType.ApproveTransaction) {
      reject();
    } else if (history.length > 1) {
      history.back();
    } else {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    }
  };

  const onSendSuccess = async (
    opHash: string,
    currentUserOp: ElytroUserOperation,
    txHash?: string
  ) => {
    wallet.addNewHistory({
      type: txType!,
      opHash,
      txHash,
      userOp: currentUserOp!,
      decodedDetail: decodedDetail!,
    });

    if (opType === UserOpType.ApproveTransaction) {
      resolve(txHash);
    }

    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, {
      activating: opType === UserOpType.DeployWallet ? '1' : '0',
    });
  };

  const handleConfirm = async () => {
    try {
      setIsSending(true);

      let currentUserOp = userOp;

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
      toast({
        title: 'Failed to send transaction',
        description:
          (error as Error).message ||
          String(error) ||
          'Unknown error, please try again',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SecondaryPageWrapper
      className="flex flex-col p-md"
      title={UserOpTitleMap[opType!]}
    >
      {/* Content */}
      <div className="flex flex-col gap-y-md">{renderContent}</div>

      {/* Footer */}
      <div className="flex w-full mt-10">
        <div className="flex w-full gap-x-2">
          {!isPacking && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSending}
              className="flex-1 rounded-md border border-gray-200"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className="flex-1 rounded-md"
            disabled={isPacking || !hasSufficientBalance || isSending}
          >
            {isPacking
              ? 'Packing...'
              : hasSufficientBalance
                ? isSending
                  ? 'Confirming...'
                  : 'Confirm'
                : 'Insufficient balance'}
          </Button>
        </div>
      </div>
    </SecondaryPageWrapper>
  );
}
