import { useState, useCallback } from 'react';
import type { THookError } from '@/types/securityHook';

/**
 * OTP 输入 Hook
 * 用于管理 OTP 输入弹窗的状态
 */
export function useOTPInput() {
  const [open, setOpen] = useState(false);
  const [hookError, setHookError] = useState<THookError | null>(null);

  const showOTP = useCallback((error: THookError) => {
    setHookError(error);
    setOpen(true);
  }, []);

  const hideOTP = useCallback(() => {
    setOpen(false);
    setHookError(null);
  }, []);

  return {
    open,
    hookError,
    showOTP,
    hideOTP,
    setOpen,
  };
}
