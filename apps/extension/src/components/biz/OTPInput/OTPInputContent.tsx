import React, { useState, useEffect } from 'react';
import { AlertTriangle, Box } from 'lucide-react';
import { InputOTPGroup, InputOTP, InputOTPSlot, Button, DialogFooter } from '@elytro/ui';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import type { THookError } from '@/types/securityHook';

export interface OTPInputProps {
  hookError: THookError | null;
  isVerifying?: boolean;
  disabled?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  title?: string;
  description?: string;
  showCancel?: boolean;
  showResend?: boolean;
  onResend?: () => void;
  onConfirm: (otpCode: string) => void | Promise<void>;
  onCancel?: () => void;
  renderCustomFooter?: (hookError: THookError) => React.ReactNode;
}

export function OTPInputContent({
  hookError,
  isVerifying = false,
  disabled = false,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  title,
  description,
  showCancel = true,
  showResend = true,
  onResend,
  onConfirm,
  onCancel,
  renderCustomFooter,
}: OTPInputProps) {
  const [otpCode, setOtpCode] = useState<string>('');

  // 计算倒计时
  const remainingTime = hookError?.otpExpiresAt
    ? Math.max(0, Math.floor(new Date(hookError.otpExpiresAt).getTime() / 1000 - Date.now() / 1000))
    : 0;

  const [countdown, setCountdown] = useState(remainingTime);

  useEffect(() => {
    // 当 remainingTime 变化时，更新 countdown
    setCountdown(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [countdown]);

  const handleConfirm = async () => {
    if (otpCode.length !== 6) {
      return;
    }
    await onConfirm(otpCode);
  };

  const handleResend = () => {
    if (countdown > 0 || !onResend) {
      return;
    }
    onResend();
    // 注意：倒计时会在 hookError.otpExpiresAt 更新后通过 useEffect 自动重置
  };

  if (!hookError) {
    return null;
  }

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-y-sm">
        <AlertTriangle className="size-24 fill-[#C4C077] text-white stroke-white" />
        <div className="elytro-text-title text-lg">{title || hookError?.message || 'OTP Required'}</div>
        <div className="text-sm text-gray-600">{description || 'Enter the code we sent to your email to continue'}</div>
      </div>
      <div className="flex flex-col items-center justify-center gap-y-sm my-2xl">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={otpCode}
          onChange={setOtpCode}
          disabled={disabled || isVerifying}
        >
          <InputOTPGroup className="flex flex-row items-center justify-center gap-x-sm">
            <InputOTPSlot index={0} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            <InputOTPSlot index={1} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            <InputOTPSlot index={2} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            <InputOTPSlot index={3} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            <InputOTPSlot index={4} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
            <InputOTPSlot index={5} className="w-10 h-10 border-none bg-gray-150 !rounded-2xs" />
          </InputOTPGroup>
        </InputOTP>
        {showResend && onResend && (
          <span
            onClick={handleResend}
            className={`text-sm text-gray-600 ${countdown > 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Resend code {countdown > 0 ? ` in ${countdown} seconds` : ''}
          </span>
        )}
      </div>

      <DialogFooter className="flex flex-row w-full gap-x-sm [&>button]:flex-1 mt-2xl">
        {renderCustomFooter ? (
          renderCustomFooter(hookError)
        ) : hookError?.code === 'LIMIT_EXCEEDED' ? (
          <Button variant="secondary" className="flex-1 rounded-md border border-gray-200" onClick={onCancel}>
            Close
          </Button>
        ) : (
          <>
            {showCancel && onCancel && (
              <Button variant="secondary" onClick={onCancel} disabled={isVerifying}>
                {cancelButtonText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className="flex-1 rounded-md"
              disabled={otpCode.length !== 6 || isVerifying || disabled}
            >
              <Box className="size-4 mr-sm stroke-white" />
              {confirmButtonText}
            </Button>
          </>
        )}
      </DialogFooter>
    </div>
  );
}
