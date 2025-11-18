import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount } from './account-context';
import { useWallet } from './wallet';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import type { TSecurityProfile } from '@/background/services/securityHook';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

type ISecurityHookContext = {
  // Auth session
  authSessionId: string | null;
  isAuthenticating: boolean;

  // Security profile
  securityProfile: TSecurityProfile | null;
  isLoadingProfile: boolean;

  // Email binding
  isBindingEmail: boolean;
  bindingId: string | null;

  // Spending limits
  isSettingDailyLimit: boolean;

  // Actions
  authenticate: () => Promise<string>;
  requestEmailBinding: (
    email: string,
    locale?: string
  ) => Promise<{
    bindingId: string;
    maskedEmail: string;
    otpExpiresAt: string;
    resendAvailableAt: string;
  }>;
  changeWalletEmail: (email: string) => Promise<TSecurityProfile>;
  confirmEmailBinding: (bindingId: string, otpCode: string) => Promise<TSecurityProfile>;
  loadSecurityProfile: () => Promise<void>;
  setDailyLimit: (dailyLimitUsdCents: number) => Promise<void>;
  clearAuthSession: () => void;
};

const SecurityHookContext = createContext<ISecurityHookContext>({
  authSessionId: null,
  isAuthenticating: false,
  securityProfile: null,
  isLoadingProfile: false,
  isBindingEmail: false,
  isSettingDailyLimit: false,
  bindingId: null,
  changeWalletEmail: async () => {
    throw new Error('Not implemented');
  },
  authenticate: async () => {
    throw new Error('Not implemented');
  },
  requestEmailBinding: async () => {
    throw new Error('Not implemented');
  },
  confirmEmailBinding: async () => {
    throw new Error('Not implemented');
  },
  loadSecurityProfile: async () => {},
  setDailyLimit: async () => {},
  clearAuthSession: () => {},
});

export const SecurityHookProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    currentAccount: { address, chainId },
  } = useAccount();
  const { wallet } = useWallet();

  const [authSessionId, setAuthSessionId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [securityProfile, setSecurityProfile] = useState<TSecurityProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isBindingEmail, setIsBindingEmail] = useState(false);
  const [bindingId, setBindingId] = useState<string | null>(null);
  const [isSettingDailyLimit, setIsSettingDailyLimit] = useState(false);
  const [pathname] = useEnhancedHashLocation();

  useEffect(() => {
    if (address && chainId && pathname === SIDE_PANEL_ROUTE_PATHS.SecurityHookSettings) {
      wallet
        .authenticateSecurityHook()
        .then((sessionId: string) => {
          setAuthSessionId(sessionId);
        })
        .catch(() => {
          // Ignore errors, session will be created when needed
        });
    }
  }, [address, chainId, wallet, pathname]);

  // Authenticate wallet
  const authenticate = useCallback(async (): Promise<string> => {
    if (!address || !chainId) {
      throw new Error('No current account');
    }

    try {
      setIsAuthenticating(true);
      const sessionId = await wallet.authenticateSecurityHook();
      setAuthSessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Elytro: Authentication failed', error);
      toast({
        title: 'Authentication failed',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, wallet]);

  // Clear auth session
  const clearAuthSession = useCallback(async () => {
    await wallet.clearSecurityHookAuthSession();
    setAuthSessionId(null);
  }, [wallet]);

  // Load security profile
  const loadSecurityProfile = useCallback(async () => {
    if (!address || !chainId) {
      return;
    }

    try {
      setIsLoadingProfile(true);
      const profile = await wallet.loadSecurityHookProfile();
      setSecurityProfile(profile);
    } catch (error) {
      console.error('Elytro: Failed to load security profile', error);
      // Don't show error if profile doesn't exist yet
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (!errorMessage.includes('NOT_FOUND') && !errorMessage.includes('not found')) {
          toast({
            title: 'Failed to load security profile',
            description: formatErrorMsg(error),
            variant: 'destructive',
          });
        }
      }
      setSecurityProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address, chainId, wallet]);

  // Request email binding
  const requestEmailBinding = useCallback(
    async (email: string, locale = 'en-US') => {
      if (!address || !chainId) {
        throw new Error('No current account');
      }

      try {
        setIsBindingEmail(true);
        const result = await wallet.requestSecurityHookEmailBinding(email, locale);
        setBindingId(result.bindingId);
        return result;
      } catch (error) {
        console.error('Elytro: Request email binding failed', error);
        toast({
          title: 'Failed to send OTP',
          description: formatErrorMsg(error),
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsBindingEmail(false);
      }
    },
    [address, chainId, wallet]
  );

  // Confirm email binding
  const confirmEmailBinding = useCallback(
    async (bindingId: string, otpCode: string) => {
      if (!address || !chainId) {
        throw new Error('No current account');
      }

      try {
        setIsBindingEmail(true);
        const result = await wallet.confirmSecurityHookEmailBinding(bindingId, otpCode);
        setSecurityProfile(result);
        setBindingId(null);
        return result;
      } catch (error) {
        console.error('Elytro: Confirm email binding failed', error);
        toast({
          title: 'Verification failed',
          description: formatErrorMsg(error),
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsBindingEmail(false);
      }
    },
    [address, chainId, wallet]
  );

  // Set daily limit
  const setDailyLimit = useCallback(
    async (dailyLimitUsdCents: number) => {
      if (!address || !chainId) {
        throw new Error('No current account');
      }

      try {
        setIsSettingDailyLimit(true);
        await wallet.setSecurityHookDailyLimit(dailyLimitUsdCents);
        // Reload profile to get updated limit
        const profile = await wallet.loadSecurityHookProfile();
        if (profile) {
          setSecurityProfile(profile);
        }
      } catch (error) {
        console.error('Elytro: Set daily limit failed', error);
        toast({
          title: 'Failed to set daily limit',
          description: formatErrorMsg(error),
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsSettingDailyLimit(false);
      }
    },
    [address, chainId, wallet]
  );

  // Change wallet email
  const changeWalletEmail = useCallback(
    async (email: string) => {
      if (!address || !chainId) {
        throw new Error('No current account');
      }

      try {
        const result = await wallet.changeWalletEmail(email);
        if (result) {
          setSecurityProfile(result);
        }
        return result;
      } catch (error) {
        console.error('Elytro: Change wallet email failed', error);
        toast({
          title: 'Failed to change wallet email',
          description: formatErrorMsg(error),
          variant: 'destructive',
        });
        throw error;
      }
    },
    [address, chainId, wallet]
  );

  return (
    <SecurityHookContext.Provider
      value={{
        authSessionId,
        isAuthenticating,
        securityProfile,
        isLoadingProfile,
        isBindingEmail,
        isSettingDailyLimit,
        bindingId,
        authenticate,
        requestEmailBinding,
        confirmEmailBinding,
        loadSecurityProfile,
        setDailyLimit,
        clearAuthSession,
        changeWalletEmail,
      }}
    >
      {children}
    </SecurityHookContext.Provider>
  );
};

export const useSecurityHook = () => {
  return useContext(SecurityHookContext);
};
