import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { Button } from '@/components/ui/button';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { AlertCircle, Box, InfoIcon } from 'lucide-react';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OTPInputContent } from '@/components/biz/OTPInput';

const UserOpTitleMap: Record<TxRequestTypeEn, string> = {
  [TxRequestTypeEn.DeployWallet]: 'Activate wallet',
  [TxRequestTypeEn.SendTransaction]: 'Send',
  [TxRequestTypeEn.ApproveTransaction]: 'Confirm transaction',
  [TxRequestTypeEn.UpgradeContract]: 'Update contract',
};

export default function Tx() {
  const {
    requestType,
    isPreparing,
    isSending,
    errorMsg,
    onConfirm,
    onCancel,
    onRetry,
    hasSufficientBalance,
    gasPaymentOption,
    hookError,
    requestSecurityOtp,
    verifySecurityOtp,
  } = useTx();

  const handleConfirmOTP = async (otpCode: string) => {
    console.log('Elytro: handleConfirmOTP', otpCode);
    try {
      await verifySecurityOtp(otpCode);
      console.log('Elytro: verifySecurityOtp success');
    } catch (error) {
      console.error('Elytro: handleConfirmOTP failed', error);
    }
  };

  if (isPreparing || isSending) {
    const message = isPreparing ? 'Preparing...' : 'Sending...';
    return <ProcessingTip body={message} />;
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col w-full items-center justify-center">
        <AlertCircle className="size-12 text-destructive animate-pulse mb-md" />

        <h2 className="text-lg font-semibold text-foreground mb-xs">Transaction Failed</h2>

        <div className="text-center text-muted-foreground text-sm mb-6 max-w-[17.5rem]">
          {errorMsg || 'Please try again or contact support'}
        </div>

        <Button onClick={() => onRetry()} className="w-full">
          Retry
        </Button>
      </div>
    );
  }

  if (!requestType) {
    return (
      <div className="flex flex-col w-full items-center justify-center">
        <InfoIcon className="size-12 text-destructive animate-pulse mb-md" />
        <h2 className="text-lg font-semibold text-foreground mb-xs">Transaction Processing</h2>

        <div className="text-center text-muted-foreground text-sm mb-6 max-w-[17.5rem]">
          Your transaction is being processed, please wait...
        </div>
      </div>
    );
  }

  if (hookError) {
    return (
      <OTPInputContent
        hookError={hookError}
        isVerifying={isSending}
        onConfirm={handleConfirmOTP}
        onCancel={onCancel}
        onResend={requestSecurityOtp}
        confirmButtonText="Confirm"
        cancelButtonText="Cancel"
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{UserOpTitleMap[requestType!]}</DialogTitle>
      </DialogHeader>
      {/* Content */}
      <div className="flex flex-col gap-y-md">
        <UserOpDetail />
      </div>

      {/* Footer */}
      <DialogFooter className="w-full gap-x-sm [&>button]:flex-1 mt-2xl">
        {isSending ? (
          <Button variant="tertiary" className="flex-1 rounded-md border border-gray-200" onClick={onCancel}>
            Close
          </Button>
        ) : (
          <div className="w-full grid grid-cols-2 gap-x-sm">
            <Button variant="tertiary" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>

            <Button
              onClick={onConfirm}
              className="flex-1 rounded-md"
              disabled={isSending || (gasPaymentOption.type === 'self' && !hasSufficientBalance)}
            >
              <Box className="size-4 mr-sm" color="#cce1ea" />
              Confirm
            </Button>
          </div>
        )}
      </DialogFooter>
    </>
  );
}
