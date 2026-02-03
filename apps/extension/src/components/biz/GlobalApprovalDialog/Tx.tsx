import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { Button, DialogFooter, DialogHeader, DialogTitle, toast, ProcessingTip } from '@elytro/ui';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { AlertCircle, Box, InfoIcon } from 'lucide-react';
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
    try {
      await verifySecurityOtp(otpCode);
    } catch (error) {
      console.error('Elytro: handleConfirmOTP failed', error);
      toast({
        title: 'Failed to verify OTP',
        description: (error as SafeAny)?.message || 'Unknown error',
        variant: 'destructive',
      });
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
    return hookError?.code === 'OTP_REQUIRED' ? (
      <OTPInputContent
        hookError={hookError}
        isVerifying={isSending}
        onConfirm={handleConfirmOTP}
        onCancel={onCancel}
        onResend={requestSecurityOtp}
        confirmButtonText="Confirm"
        cancelButtonText="Cancel"
      />
    ) : (
      <div className="flex flex-col w-full items-center justify-center">
        <AlertCircle className="size-12 text-destructive animate-pulse mb-md" />

        <h2 className="text-lg font-semibold text-foreground mb-xs">Transaction Failed</h2>

        <div className="text-center text-muted-foreground text-sm mb-6 max-w-[17.5rem]">
          {(hookError as SafeAny)?.message || errorMsg || 'Please try again or contact support'}
        </div>

        <Button onClick={() => onRetry()} className="w-full">
          Retry
        </Button>
      </div>
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
          <Button variant="secondary" className="flex-1 rounded-md border border-gray-200" onClick={onCancel}>
            Close
          </Button>
        ) : (
          <div className="w-full grid grid-cols-2 gap-x-sm">
            <Button variant="secondary" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>

            <Button
              onClick={onConfirm}
              className="flex-1 rounded-md"
              disabled={isSending || (gasPaymentOption.type === 'self' && !hasSufficientBalance)}
            >
              <Box className="size-4 mr-sm stroke-white" />
              Confirm
            </Button>
          </div>
        )}
      </DialogFooter>
    </>
  );
}
