import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { AlertCircle, AlertTriangle, Box } from 'lucide-react';
import { InputOTPGroup, InputOTP, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet';

const UserOpTitleMap: Record<TxRequestTypeEn, string> = {
  [TxRequestTypeEn.DeployWallet]: 'Activate wallet',
  [TxRequestTypeEn.SendTransaction]: 'Send',
  [TxRequestTypeEn.ApproveTransaction]: 'Confirm transaction',
  [TxRequestTypeEn.UpgradeContract]: 'Update contract',
};

function TxConfirm() {
  const { wallet: _wallet } = useWallet();
  const {
    requestType,
    isPreparing,
    isSending,
    errorMsg,
    onConfirm,
    onCancel,
    onRetry,
    hasSufficientBalance,
    hookError,
    requestSecurityOtp,
    verifySecurityOtp,
  } = useTx();

  const [otpCode, setOtpCode] = useState<string>('');

  const handleOtpChange = (value: string) => {
    console.log('Elytro: handleOtpChange', value);
    setOtpCode(value);
  };

  const handleConfirmOTP = async () => {
    console.log('Elytro: handleConfirmOTP', otpCode);
    try {
      await verifySecurityOtp(otpCode);
      console.log('Elytro: verifySecurityOtp success');
    } catch (error) {
      console.error('Elytro: handleConfirmOTP failed', error);
    }
  };

  const remainingTime = hookError?.otpExpiresAt ? new Date(hookError.otpExpiresAt).getTime() - Date.now() : 0;

  const [countdown, setCountdown] = useState(remainingTime);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (remainingTime > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [remainingTime]);

  if (isPreparing || isSending) {
    const message = isPreparing ? 'Loading transaction details...' : 'Preparing and sending transaction...';
    return <ProcessingTip body={message} />;
  }

  console.log('Elytro: errorMsg', errorMsg, !!errorMsg);
  if (errorMsg) {
    return (
      <div className="flex flex-col w-full items-center justify-center  p-6">
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
    return null;
  }

  if (hookError) {
    return (
      <div className="flex flex-col w-full items-center justify-center  p-6">
        <div className="flex flex-col items-center justify-center gap-y-sm">
          <AlertTriangle className="size-24 fill-[#C4C077] text-white stroke-white" />
          <div className="elytro-text-title text-lg">Spending limit exceeded</div>
          <div className="text-sm text-gray-600">Enter the code we sent to your email to continue</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-y-sm my-2xl">
          <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={otpCode} onChange={handleOtpChange}>
            <InputOTPGroup className="flex flex-row items-center justify-center gap-x-sm">
              <InputOTPSlot index={0} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
              <InputOTPSlot index={1} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
              <InputOTPSlot index={2} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
              <InputOTPSlot index={3} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
              <InputOTPSlot index={4} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
              <InputOTPSlot index={5} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            </InputOTPGroup>
          </InputOTP>
          {/* TODO: Resend OTP ?*/}
          <span
            onClick={() => requestSecurityOtp()}
            className={`text-sm text-gray-600 ${countdown > 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Resend code {countdown > 0 ? ` in ${countdown} seconds` : ''}
          </span>
        </div>

        <div className="flex w-full gap-x-sm [&>button]:flex-1 mt-xl">
          {hookError?.code === 'LIMIT_EXCEEDED' ? (
            <Button variant="ghost" className="flex-1 rounded-md border border-gray-200" onClick={onCancel}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onCancel} disabled={isSending}>
                Cancel
              </Button>

              <Button onClick={handleConfirmOTP} className="flex-1 rounded-md" disabled={otpCode.length !== 6}>
                <Box className="size-4 mr-sm" color="#cce1ea" />
                Confirm
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <>
      {/* Content */}
      <div className="flex flex-col gap-y-md">
        <UserOpDetail />
      </div>

      {/* Footer */}
      <div className="flex w-full gap-x-sm [&>button]:flex-1 mt-xl">
        {isSending ? (
          <Button variant="ghost" className="flex-1 rounded-md border border-gray-200" onClick={onCancel}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>

            <Button onClick={onConfirm} className="flex-1 rounded-md" disabled={isSending || !hasSufficientBalance}>
              <Box className="size-4 mr-sm" color="#cce1ea" />
              Confirm
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
    <SecondaryPageWrapper className="flex flex-col p-md" title={UserOpTitleMap[requestType!]} onBack={onCancel}>
      <TxConfirm />
    </SecondaryPageWrapper>
  );
}
