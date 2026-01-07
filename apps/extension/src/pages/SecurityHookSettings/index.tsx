import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import { useWallet } from '@/contexts/wallet';
import { useTx } from '@/contexts/tx-context';
import { SecurityHookProvider, useSecurityHook } from '@/contexts/securityHook-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import type { Transaction } from '@elytro/sdk';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { AlertCircle, Mail, PauseOctagon, Edit2, X } from 'lucide-react';
import Spin from '@/components/ui/Spin';
import GuardianIcon from '@/assets/icons/guardian.svg';
import { getChainNameByChainId } from '@/constants/chains';
import { THookStatus } from '@/types/securityHook';
import { RuntimeMessage } from '@/utils/message';
import { EVENT_TYPES } from '@/constants/events';
import { Switch } from '@/components/ui/switch';
import HelperText from '@/components/ui/HelperText';
import ShortedAddress from '@/components/ui/ShortedAddress';
import Copy from '@/components/ui/Copy';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NavItem from '@/components/ui/NavItem';
import { OTPInputDialog, useOTPInput } from '@/components/biz/OTPInput';
import ConfirmPreForceUninstallModal from './ConfirmPreForceUninstallModal';
import ForceInstallInnerPage from './ForceInstallPage';

function SecurityHookSettingsInnerPage() {
  const {
    currentAccount: { address, chainId },
    reloadAccount,
  } = useAccount();
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const {
    securityProfile,
    isBindingEmail,
    setDailyLimit,
    bindingId,
    requestEmailBinding,
    confirmEmailBinding,
    loadSecurityProfile,
    isSettingDailyLimit,
    changeWalletEmail,
    requestDailyLimitOtp,
  } = useSecurityHook();
  const [showSpendingLimitsConfig, setShowSpendingLimitsConfig] = useState(false);
  const [dailyLimitUsd, setDailyLimitUsd] = useState(
    securityProfile?.dailyLimitUsdCents ? securityProfile?.dailyLimitUsdCents / 100 : 0
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hookStatus, setHookStatus] = useState<THookStatus | null>(null);
  const isCheckingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const { open: otpDialogOpen, hookError: otpHookError, showOTP, hideOTP } = useOTPInput();
  const {
    open: limitOtpDialogOpen,
    hookError: limitOtpHookError,
    showOTP: showLimitOTP,
    hideOTP: hideLimitOTP,
  } = useOTPInput();
  const [pendingDailyLimitUsdCents, setPendingDailyLimitUsdCents] = useState<number | null>(null);
  const [originalDailyLimitUsd, setOriginalDailyLimitUsd] = useState<number | null>(null);

  // 调试：追踪状态变化
  useEffect(() => {
    console.log('Elytro: limitOtpDialogOpen changed', limitOtpDialogOpen, 'limitOtpHookError:', limitOtpHookError);
  }, [limitOtpDialogOpen, limitOtpHookError]);

  // Check Hook status
  const checkStatus = useCallback(async () => {
    if (isCheckingRef.current || !address || !chainId) {
      return;
    }

    try {
      isCheckingRef.current = true;
      setChecking(true);

      const status = await wallet.getSecurityHookStatus();
      setHookStatus(status);
      console.log('status', status);
    } catch (error) {
      console.error('Failed to check SecurityHook status:', error);
      toast({
        title: 'Failed to check SecurityHook status',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
      isCheckingRef.current = false;
    }
  }, [address, chainId, wallet]);

  useEffect(() => {
    if (hookStatus?.securityHookAddress) {
      loadSecurityProfile();
      if (securityProfile?.email) {
        setEmail(securityProfile.email);
      }
      if (securityProfile?.dailyLimitUsdCents) {
        setDailyLimitUsd(securityProfile.dailyLimitUsdCents / 100);
      }
    }
  }, [hookStatus?.securityHookAddress, loadSecurityProfile, securityProfile?.email]);

  // Reset editing state when email is verified
  useEffect(() => {
    if (securityProfile?.emailVerified && !isBindingEmail && !otpDialogOpen) {
      setIsEditingEmail(false);
    }
  }, [securityProfile?.emailVerified, isBindingEmail, otpDialogOpen]);

  // Initial check
  useEffect(() => {
    if (address && chainId) {
      checkStatus();
    }
  }, [address, chainId, checkStatus]);

  useEffect(() => {
    const handleHistoryUpdated = () => {
      // Delay check to ensure on-chain state is updated
      setTimeout(() => {
        checkStatus();
        reloadAccount(true);
      }, 2000);
    };

    RuntimeMessage.onMessage(EVENT_TYPES.HISTORY.ITEMS_UPDATED, handleHistoryUpdated);

    return () => {
      RuntimeMessage.offMessage(handleHistoryUpdated);
    };
  }, [checkStatus, reloadAccount]);

  const handleInstall = async () => {
    try {
      setLoading(true);
      const txs = await wallet.generateInstallSecurityHookTxs();
      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
    } catch (error) {
      console.error('Install SecurityHook failed:', error);
      toast({
        title: 'Failed to install SecurityHook',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async () => {
    try {
      setLoading(true);

      // const canForce = await wallet.canForceUninstallSecurityHook?.();

      // if (canForce) {
      //   const txs = await wallet.generatePreForceUninstallSecurityHookTxs();
      //   handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
      // } else {
      //   const txs = await wallet.generateUninstallSecurityHookTxs();
      //   handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
      // }

      const txs = await wallet.generateUninstallSecurityHookTxs();
      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
    } catch (error) {
      console.error('Uninstall SecurityHook failed:', error);
      const errorMsg = formatErrorMsg(error);

      // Check if it's AA24Error or validation failure
      if (errorMsg.includes('AA24') || errorMsg.includes('validation') || errorMsg.includes('verify')) {
        toast({
          title: 'Cannot uninstall directly',
          description: 'Please use "Force Disable" after the safety delay period, or wait and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to uninstall SecurityHook',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    if (!email || email.trim().length === 0) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return false;
    }

    const parts = email.trim().split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domain] = parts;

    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    if (domain.length === 0 || domain.length > 255) {
      return false;
    }

    if (!domain.includes('.')) {
      return false;
    }

    if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
      return false;
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 63) {
      return false;
    }

    if (!/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    return true;
  };

  const handleRequestEmailBinding = async () => {
    if (!isValidEmail(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address (e.g., example@domain.com)',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await requestEmailBinding(email);
      if (result) {
        // 显示 OTP 弹窗
        showOTP({
          code: 'OTP_REQUIRED',
          challengeId: result.bindingId,
          maskedEmail: result.maskedEmail,
          otpExpiresAt: result.otpExpiresAt,
          message: 'Enter the code we sent to your email to verify',
        });
        toast({
          title: 'OTP sent',
          description: `Verification code sent to ${result.maskedEmail || email}`,
        });
      }
    } catch (error) {
      // Error is already handled in context
      console.error('Request email binding failed:', error);
    }
  };

  const handleChangeWalletEmail = async () => {
    if (!isValidEmail(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address (e.g., example@domain.com)',
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await changeWalletEmail(email);
      if (result?.bindingId) {
        // 显示 OTP 弹窗
        showOTP({
          code: 'OTP_REQUIRED',
          challengeId: result.bindingId,
          maskedEmail: result.maskedEmail,
          otpExpiresAt: result.otpExpiresAt,
          message: 'Enter the code we sent to your email to verify',
        });
        toast({
          title: 'OTP sent',
          description: `Verification code sent to ${result.maskedEmail || email}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to change wallet email',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
    }
  };

  const handleConfirmEmailBinding = async (otpCode: string) => {
    // 从 hookError 中获取 challengeId（即 bindingId）
    const currentBindingId = otpHookError?.challengeId || bindingId;

    if (!currentBindingId || !otpCode || otpCode.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP code',
        variant: 'destructive',
      });
      return;
    }

    const wasEditing = isEditingEmail;

    try {
      await confirmEmailBinding(currentBindingId, otpCode);
      hideOTP();
      setIsEditingEmail(false);
      toast({
        title: 'Email verified',
        description: wasEditing
          ? 'Your email has been successfully updated'
          : 'Your email has been successfully linked to your wallet',
      });
    } catch (error) {
      // Error is already handled in context
      console.error('Confirm email binding failed:', error);
    }
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    hideOTP();
    setEmailError(null);
    // Reset email to original value
    if (securityProfile?.email) {
      setEmail(securityProfile.email);
    }
  };

  if (checking) {
    return (
      <SecondaryPageWrapper title="Sign with 2FA">
        <ProcessingTip body="Checking 2FA status..." />
      </SecondaryPageWrapper>
    );
  }

  if (hookStatus && !hookStatus.securityHookAddress) {
    return (
      <SecondaryPageWrapper title="Sign with 2FA">
        <div className="flex flex-col gap-y-md items-center justify-center p-6">
          <AlertCircle className="size-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Not Supported</h2>
          <div className="text-center text-muted-foreground text-sm">
            2FA is not supported on {getChainNameByChainId(chainId)}.
          </div>
        </div>
      </SecondaryPageWrapper>
    );
  }

  if (hookStatus?.isStartPreForceUninstall) {
    return <ForceInstallInnerPage status={hookStatus} />;
  }

  return (
    <SecondaryPageWrapper
      title="Sign with 2FA"
      onBack={() => {
        if (showSpendingLimitsConfig) {
          setShowSpendingLimitsConfig(false);
        } else {
          history.back();
        }
      }}
    >
      <div className="flex flex-col gap-y-md">
        <h2 className="elytro-text-small text-gray-600">Your wallet</h2>

        {/* Operation Bar */}
        <div className="flex flex-row items-center gap-2">
          <ShortedAddress address={address} chainId={chainId} />
          <Copy text={address} size="sm" />
        </div>

        <HelperText description="Use email to confirm certain wallet activities" />

        {showSpendingLimitsConfig ? (
          <>
            <div className="elytro-text-bold-body text-gray-600">Daily spending limit</div>

            <Input
              placeholder="Enter daily spending limit (USD)"
              value={dailyLimitUsd > 0 ? `$ ${dailyLimitUsd}` : 'No limit'}
              className="bg-gray-150 rounded-md py-6"
              onChange={(e) => {
                // limit to numbers only
                const value = e.target.value.replace(/[^0-9]/g, '');
                setDailyLimitUsd(Number(value));
              }}
              prefix="$"
            />
            <Button
              variant="secondary"
              className="w-full"
              disabled={dailyLimitUsd * 100 === securityProfile?.dailyLimitUsdCents || isSettingDailyLimit}
              onClick={async () => {
                const newLimitUsdCents = dailyLimitUsd * 100;
                try {
                  // 保存当前的 limit 值作为原始值，用于取消时恢复
                  setOriginalDailyLimitUsd(dailyLimitUsd);

                  await requestDailyLimitOtp(newLimitUsdCents);

                  setPendingDailyLimitUsdCents(newLimitUsdCents);

                  showLimitOTP({
                    code: 'OTP_REQUIRED',
                    challengeId: '',
                    maskedEmail: '',
                    otpExpiresAt: '',
                    message: 'Enter the code we sent to your email to confirm the daily limit change',
                  });
                  console.log('Elytro: After showLimitOTP called');

                  toast({
                    title: 'OTP sent',
                    description: `Verification code sent`,
                  });
                } catch (error) {
                  console.error('Elytro: Request daily limit OTP failed', error);
                  // Error is already handled in context
                  // 如果请求失败，清除保存的原始值
                  setOriginalDailyLimitUsd(null);
                }
              }}
            >
              {isSettingDailyLimit ? <Spin size="sm" isLoading inline className="mr-2" /> : 'Save'}
            </Button>
          </>
        ) : (
          <>
            <div className="elytro-text-small text-gray-600">Linked Email</div>

            {securityProfile?.emailVerified && !isEditingEmail ? (
              <div className="flex flex-col gap-y-2">
                <div className="flex flex-row items-center justify-between border-gray-300 border rounded-md p-lg h-16 bg-gray-50">
                  <div className="flex flex-row items-center gap-x-3">
                    <Mail className="size-5 text-gray-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-600 mb-0">{securityProfile.email}</span>
                      <span className="text-xs text-gray-400">Verified</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-x-2">
                    {/* <Check className="size-5 text-green" /> */}
                    <button
                      onClick={() => {
                        setIsEditingEmail(true);
                        setEmail(securityProfile.email || '');
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={isBindingEmail}
                      aria-label="Edit email"
                    >
                      <Edit2 className="size-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-md p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-3">
                      <img src={GuardianIcon} alt="Guardian" className="size-5" />
                      <span className="text-base font-normal">Sign with 2FA</span>
                    </div>
                    <Switch
                      checked={hookStatus?.isInstalled || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInstall();
                        } else {
                          handleUninstall();
                        }
                      }}
                      disabled={loading || checking}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-y-1">
                  <div
                    className={`flex flex-row items-center border rounded-md p-lg h-16 text-gray-900 ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <Mail className={`size-6 ${emailError ? 'text-red-500' : 'text-gray-600'}`} />
                    <Input
                      className="bg-transparent !border-none !ring-0 !ring-offset-0 !outline-none flex-1"
                      placeholder={isEditingEmail ? 'Enter new email address' : 'Enter email address'}
                      value={email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEmail(value);
                        // Real-time validation
                        if (value.trim().length > 0 && !isValidEmail(value)) {
                          setEmailError('Please enter a valid email address');
                        } else {
                          setEmailError(null);
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (email.trim().length > 0 && !isValidEmail(email)) {
                          setEmailError('Please enter a valid email address');
                        } else {
                          setEmailError(null);
                        }
                      }}
                      disabled={isBindingEmail}
                      type="email"
                    />
                    {isEditingEmail && (
                      <button
                        onClick={handleCancelEditEmail}
                        className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                        disabled={isBindingEmail}
                        aria-label="Cancel editing"
                      >
                        <X className="size-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  {emailError && <p className="text-xs text-red-500 px-1">{emailError}</p>}
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={isBindingEmail || !isValidEmail(email)}
                  onClick={isEditingEmail ? handleChangeWalletEmail : handleRequestEmailBinding}
                >
                  {isBindingEmail ? (
                    <>
                      <Spin size="sm" isLoading inline className="mr-2" />
                      Sending...
                    </>
                  ) : isEditingEmail ? (
                    'Update Email'
                  ) : (
                    'Link Email'
                  )}
                </Button>
              </>
            )}

            {hookStatus?.isInstalled && securityProfile?.emailVerified && (
              <>
                <div className="elytro-text-bold-body text-gray-600">Security settings</div>
                <div className="rounded-md overflow-hidden shadow-sm">
                  <NavItem
                    icon={PauseOctagon}
                    label="Spending limits"
                    value={
                      securityProfile?.dailyLimitUsdCents ? `$${securityProfile?.dailyLimitUsdCents / 100}` : 'No limit'
                    }
                    onClick={() => {
                      setShowSpendingLimitsConfig(true);
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}

        <ConfirmPreForceUninstallModal />

        {/* 邮箱修改 OTP 输入弹窗 */}
        <OTPInputDialog
          open={otpDialogOpen}
          hookError={otpHookError}
          isVerifying={isBindingEmail}
          onOpenChange={(open: boolean) => {
            if (!open) {
              hideOTP();
              handleCancelEditEmail();
            }
          }}
          onConfirm={handleConfirmEmailBinding}
          onCancel={() => {
            hideOTP();
            handleCancelEditEmail();
          }}
          confirmButtonText="Verify OTP"
          cancelButtonText="Cancel"
          showResend={false}
        />

        {/* 每日限额设置 OTP 输入弹窗 */}
        <OTPInputDialog
          open={limitOtpDialogOpen}
          hookError={limitOtpHookError}
          isVerifying={isSettingDailyLimit}
          onOpenChange={(open: boolean) => {
            console.log(
              'Elytro: limitOtpDialogOpen onOpenChange',
              open,
              'limitOtpDialogOpen:',
              limitOtpDialogOpen,
              'hookError:',
              limitOtpHookError
            );
            if (!open) {
              hideLimitOTP();
              setPendingDailyLimitUsdCents(null);
              // 恢复 limit 输入框为原始值
              if (originalDailyLimitUsd !== null) {
                setDailyLimitUsd(originalDailyLimitUsd);
                setOriginalDailyLimitUsd(null);
              }
            }
          }}
          onConfirm={async (otpCode: string) => {
            if (!pendingDailyLimitUsdCents) {
              toast({
                title: 'Error',
                description: 'No pending limit to set',
                variant: 'destructive',
              });
              return;
            }
            try {
              await setDailyLimit(pendingDailyLimitUsdCents, otpCode);
              hideLimitOTP();
              setPendingDailyLimitUsdCents(null);
              setOriginalDailyLimitUsd(null); // 清除保存的原始值
              setShowSpendingLimitsConfig(false);
              toast({
                title: 'Daily limit updated',
                description: 'Your daily spending limit has been successfully updated',
              });
            } catch (error) {
              console.error('Set daily limit failed:', error);
              // Error is already handled in context
            }
          }}
          onCancel={() => {
            hideLimitOTP();
            setPendingDailyLimitUsdCents(null);
            // 恢复 limit 输入框为原始值
            if (originalDailyLimitUsd !== null) {
              setDailyLimitUsd(originalDailyLimitUsd);
              setOriginalDailyLimitUsd(null);
            }
          }}
          confirmButtonText="Confirm"
          cancelButtonText="Cancel"
          showResend={false}
        />
      </div>
    </SecondaryPageWrapper>
  );
}

export default function SecurityHookSettings() {
  return (
    <SecurityHookProvider>
      <SecurityHookSettingsInnerPage />
    </SecurityHookProvider>
  );
}
