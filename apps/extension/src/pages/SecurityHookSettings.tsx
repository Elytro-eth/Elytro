import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import { useWallet } from '@/contexts/wallet';
import { useTx } from '@/contexts/tx-context';
import { useSecurityHook } from '@/contexts/securityHook-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import type { Transaction } from '@elytro/sdk';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { AlertCircle, Mail, Check, Loader2 } from 'lucide-react';
import GuardianIcon from '@/assets/icons/guardian.svg';
import { getChainNameByChainId } from '@/constants/chains';
import { THookStatus } from '@/types/securityHook';
import { RuntimeMessage } from '@/utils/message';
import { EVENT_TYPES } from '@/constants/events';
import { Switch } from '@/components/ui/switch';
import CurrentAddress from '@/components/biz/CurrentAddress';
import HelperText from '@/components/ui/HelperText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SecurityHookSettings() {
  const {
    currentAccount: { address, chainId },
    reloadAccount,
  } = useAccount();
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const { securityProfile, isBindingEmail, bindingId, requestEmailBinding, confirmEmailBinding, loadSecurityProfile } =
    useSecurityHook();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hookStatus, setHookStatus] = useState<THookStatus | null>(null);
  const isCheckingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
    if (hookStatus?.isInstalled) {
      loadSecurityProfile();
      if (securityProfile?.email) {
        setEmail(securityProfile.email);
      }
    }
  }, [hookStatus?.isInstalled, loadSecurityProfile, securityProfile?.email]);

  // Initial check
  useEffect(() => {
    if (address && chainId) {
      checkStatus();
    }
  }, [address, chainId, checkStatus]);

  // Listen to history update events (triggered when transaction completes)
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

  // Install SecurityHook
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

      const canForce = await wallet.canForceUninstallSecurityHook?.();

      if (canForce) {
        const txs = await wallet.generatePreForceUninstallSecurityHookTxs();
        handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
      } else {
        const txs = await wallet.generateUninstallSecurityHookTxs();
        handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
      }
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

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    if (!email || email.trim().length === 0) {
      return false;
    }

    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check basic format
    if (!emailRegex.test(email.trim())) {
      return false;
    }

    // Additional checks
    const parts = email.trim().split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domain] = parts;

    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    // Domain validation
    if (domain.length === 0 || domain.length > 255) {
      return false;
    }

    // Check for valid domain format (must have at least one dot)
    if (!domain.includes('.')) {
      return false;
    }

    // Check domain doesn't start or end with dot or hyphen
    if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
      return false;
    }

    // Check TLD (top-level domain) exists and is valid
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 63) {
      return false;
    }

    // TLD should only contain letters
    if (!/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    return true;
  };

  // Email binding handlers
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
        setShowOtpInput(true);
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

  const handleConfirmEmailBinding = async () => {
    if (!bindingId || !otpCode || otpCode.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP code',
        variant: 'destructive',
      });
      return;
    }

    try {
      await confirmEmailBinding(bindingId, otpCode);
      setShowOtpInput(false);
      setOtpCode('');
      toast({
        title: 'Email verified',
        description: 'Your email has been successfully linked to your wallet',
      });
    } catch (error) {
      // Error is already handled in context
      console.error('Confirm email binding failed:', error);
    }
  };

  if (checking) {
    return (
      <SecondaryPageWrapper title="Security with 2FA">
        <ProcessingTip body="Checking 2FA status..." />
      </SecondaryPageWrapper>
    );
  }

  if (hookStatus && !hookStatus.securityHookAddress) {
    return (
      <SecondaryPageWrapper title="Security with 2FA">
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

  return (
    <SecondaryPageWrapper title="Security with 2FA">
      <div className="flex flex-col gap-y-md">
        {/* Your wallet section */}
        <div className="flex flex-row justify-between items-center gap-y-md">
          <div className="text-[16px] font-semibold">Your wallet</div>
          <CurrentAddress className="bg-gray-150 rounded-2xs" />
        </div>

        <HelperText description="Use email to confirm certain wallet activities" />

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              {hookStatus?.isInstalled ? (
                <img src={GuardianIcon} alt="Guardian" className="size-5 text-green" />
              ) : (
                <img src={GuardianIcon} alt="Guardian" className="size-5 text-gray-400" />
              )}
              <span className="text-base font-normal">Extra security</span>
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

        <div className="text-[16px] font-semibold">Linked Email</div>

        {securityProfile?.emailVerified ? (
          <div className="flex flex-row items-center justify-between border-gray-300 border rounded-md p-lg h-16 bg-gray-50">
            <div className="flex flex-row items-center gap-x-2">
              <Mail className="size-6 text-gray-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{securityProfile.email}</span>
                <span className="text-xs text-gray-500">Verified</span>
              </div>
            </div>
            <Check className="size-5 text-green" />
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
                  placeholder="Enter email address"
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
                  disabled={isBindingEmail || showOtpInput}
                  type="email"
                />
              </div>
              {emailError && <p className="text-xs text-red-500 px-1">{emailError}</p>}
            </div>

            {showOtpInput ? (
              <>
                <div className="flex flex-row items-center border-gray-300 border rounded-md p-lg h-16 text-gray-900">
                  <Mail className="size-6 text-gray-600" />
                  <Input
                    className="bg-transparent !border-none !ring-0 !ring-offset-0 !outline-none flex-1"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                    }}
                    disabled={isBindingEmail}
                    type="text"
                    maxLength={6}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="large"
                  className="w-full"
                  disabled={isBindingEmail || otpCode.length !== 6}
                  onClick={handleConfirmEmailBinding}
                >
                  {isBindingEmail ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="medium"
                  className="w-full"
                  disabled={isBindingEmail}
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtpCode('');
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="large"
                className="w-full"
                disabled={isBindingEmail || !isValidEmail(email)}
                onClick={handleRequestEmailBinding}
              >
                {isBindingEmail ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Link Email'
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </SecondaryPageWrapper>
  );
}
