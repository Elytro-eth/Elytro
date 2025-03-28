import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { useAccount } from '@/contexts/account-context';
import { AlertCircle } from 'lucide-react';

const UserOpTitleMap = {
  [TxRequestTypeEn.DeployWallet]: 'Activate account',
  [TxRequestTypeEn.SendTransaction]: 'Send',
  [TxRequestTypeEn.ApproveTransaction]: 'Confirm transaction',
};

function TxConfirm() {
  const {
    requestType,
    isPacking,
    isSending,
    errorMsg,
    hasSufficientBalance,
    userOp,
    calcResult,
    decodedDetail,
    onConfirm,
    onCancel,
    onRetry,
  } = useTx();
  const {
    currentAccount: { chainId },
  } = useAccount();

  if (isPacking || isSending) {
    return (
      <ProcessingTip body={isSending ? 'Confirming...' : 'Preparing...'} />
    );
  }

  if (errorMsg || !requestType) {
    return (
      <div className="flex flex-col w-full items-center justify-center  p-6">
        <AlertCircle className="size-12 text-destructive animate-pulse mb-md" />

        <h2 className="text-lg font-semibold text-foreground mb-xs">
          Transaction Failed
        </h2>

        <div className="text-center text-muted-foreground text-sm mb-6 max-w-[280px]">
          {errorMsg || 'Please try again or contact support'}
        </div>

        <Button onClick={onRetry} className="w-full">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Content */}
      <div className="flex flex-col gap-y-md">
        <UserOpDetail
          requestType={requestType}
          calcResult={calcResult}
          chainId={chainId!}
          decodedUserOp={decodedDetail}
          from={userOp?.sender}
        />
      </div>

      {/* Footer */}
      <div className="flex w-full gap-x-sm [&>button]:flex-1 mt-2xl">
        {isSending ? (
          <Button
            variant="ghost"
            className="flex-1 rounded-md border border-gray-200"
            onClick={onCancel}
          >
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>

            <Button
              onClick={onConfirm}
              className="flex-1 rounded-md"
              disabled={!hasSufficientBalance || isSending}
            >
              {hasSufficientBalance ? 'Confirm' : 'Insufficient balance'}
            </Button>
          </>
        )}
      </div>
    </>
  );
}

export default function TxConfirmPage() {
  const { requestType, onCancel } = useTx();

  return (
    <SecondaryPageWrapper
      className="flex flex-col p-md"
      title={UserOpTitleMap[requestType!]}
      onBack={onCancel}
    >
      <TxConfirm />
    </SecondaryPageWrapper>
  );
}
