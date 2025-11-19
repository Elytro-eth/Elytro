import { Address } from 'viem';

/**
 * Hook 状态
 */
export type THookStatus = {
  hasPreIsValidSignatureHooks: boolean;
  hasPreUserOpValidationHooks: boolean;
  isInstalled: boolean;
  securityHookAddress: Address;
  isStartPreForceUninstall: boolean;
  canForceUninstall: boolean;
  forceUninstallAfter: number;
};

/**
 * SecurityHook 用户数据
 */
export type TSecurityHookUserData = {
  isInstalled: boolean;
  safetyDelay: number;
  forceUninstallAfter: number; // 强制卸载时间戳（0 表示不可卸载）
};

export type THookError = {
  code?: string;
  challengeId?: string;
  currentSpendUsdCents?: number;
  dailyLimitUsdCents?: number;
  maskedEmail?: string;
  otpExpiresAt?: string;
  projectedSpendUsdCents?: number;
};
