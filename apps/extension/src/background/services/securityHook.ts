import { mutate, mutate_authorize_user_operation, mutate_change_email } from '@/requests/mutate';
import { query } from '@/requests/query';
import {
  mutate_request_wallet_auth_challenge,
  mutate_confirm_wallet_auth_challenge,
  mutate_request_wallet_email_binding,
  mutate_confirm_wallet_email_binding,
  mutate_set_wallet_daily_limit,
  mutate_request_security_otp,
  mutate_verify_security_otp,
} from '@/requests/mutate';
import { query_wallet_security_profile } from '@/requests/query';
import { toHex, Hex, Address } from 'viem';
import { formatHex } from '@/utils/format';

export type TSecurityProfile = {
  email?: string;
  emailVerified?: boolean;
  maskedEmail?: string;
  dailyLimitUsdCents?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TRequestEmailBindingResult = {
  bindingId: string;
  maskedEmail: string;
  otpExpiresAt: string;
  resendAvailableAt: string;
};

type SignMessageFn = (message: Hex, saAddress: Address) => Promise<string>;
type GetCurrentAccountFn = () => { address: string; chainId: number } | null;
type GetEntryPointFn = () => string | null;

/**
 * Security Hook Service
 * Manages security hook related operations including authentication, profile, email binding, and hook signatures
 */
class SecurityHookService {
  private signMessage: SignMessageFn;
  private getCurrentAccount: GetCurrentAccountFn;
  private getEntryPoint: GetEntryPointFn;

  constructor(signMessage: SignMessageFn, getCurrentAccount: GetCurrentAccountFn, getEntryPoint: GetEntryPointFn) {
    this.signMessage = signMessage;
    this.getCurrentAccount = getCurrentAccount;
    this.getEntryPoint = getEntryPoint;
  }

  /**
   * Get session storage key for current account
   */
  private getSessionKey(): string | null {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      return null;
    }
    return `authSession_${currentAccount.address}_${currentAccount.chainId}`;
  }

  /**
   * Load auth session from storage
   */
  private async loadAuthSession(): Promise<string | null> {
    const key = this.getSessionKey();
    if (!key) {
      return null;
    }

    try {
      const result = await chrome.storage.local.get(key);
      const data = result[key];

      if (!data) {
        return null;
      }

      // Check if session is expired
      if (Date.now() > (data.expiresAt as number) * 1000) {
        // Session expired, remove it
        await chrome.storage.local.remove(key);
        return null;
      }

      return data.authSessionId;
    } catch (error) {
      console.error('Elytro: Failed to load auth session', error);
      return null;
    }
  }

  /**
   * Store auth session
   */
  private async storeAuthSession(sessionId: string, expiresAt: string): Promise<void> {
    const key = this.getSessionKey();
    if (!key) {
      return;
    }

    const data = {
      authSessionId: sessionId,
      expiresAt: new Date(expiresAt).getTime(),
    };

    try {
      await chrome.storage.local.set({ [key]: data });
    } catch (error) {
      console.error('Elytro: Failed to store auth session', error);
    }
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorObj = error as Record<string, unknown>;
    const errorCode = (errorObj.extensions as Record<string, unknown>)?.code || errorObj.code;
    const errorMessage = String(errorObj.message || '').toLowerCase();

    // Check for authentication-related error codes
    if (errorCode === 'FORBIDDEN' || errorCode === 'UNAUTHORIZED') {
      return true;
    }

    // Check for authentication-related error messages
    if (
      errorMessage.includes('failed to authenticate') ||
      errorMessage.includes('authentication failed') ||
      errorMessage.includes('session') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('invalid session')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Authenticate wallet and get session ID
   */
  public async authenticate(): Promise<string> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    // Check if we already have a valid session
    const existingSession = await this.loadAuthSession();
    if (existingSession) {
      return existingSession;
    }

    try {
      const challengeResult = await mutate<{
        requestWalletAuthChallenge: {
          challengeId: string;
          message: string;
          expiresAt: string;
        };
      }>(mutate_request_wallet_auth_challenge, {
        input: {
          chainID: `0x${currentAccount.chainId.toString(16)}`,
          address: currentAccount.address.toLowerCase(),
        },
      });

      const challenge = challengeResult.requestWalletAuthChallenge;

      // Sign message using provided signMessage function
      const signature = await this.signMessage(
        toHex(challenge.message) as `0x${string}`,
        currentAccount.address as `0x${string}`
      );

      const confirmResult = await mutate<{
        confirmWalletAuthChallenge: {
          sessionId: string;
          expiresAt: string;
        };
      }>(mutate_confirm_wallet_auth_challenge, {
        input: {
          chainID: `0x${currentAccount.chainId.toString(16)}`,
          address: currentAccount.address.toLowerCase(),
          challengeId: challenge.challengeId,
          signature,
        },
      });

      const sessionId = confirmResult.confirmWalletAuthChallenge.sessionId;
      await this.storeAuthSession(sessionId, confirmResult.confirmWalletAuthChallenge.expiresAt);

      return sessionId;
    } catch (error) {
      console.error('Elytro: Authentication failed', error);
      throw error;
    }
  }

  /**
   * Get or create authentication session
   * This method handles retries with fresh authentication if needed
   */
  public async getAuthSession(maxRetries = 1): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Clear session on retry (except first attempt)
        if (attempt > 0) {
          await this.clearAuthSession();
        }

        // Try to load existing session first
        let sessionId = await this.loadAuthSession();
        if (!sessionId) {
          // Create new session if needed
          sessionId = await this.authenticate();
        }

        if (!sessionId) {
          throw new Error('Failed to authenticate');
        }

        return sessionId;
      } catch (error: unknown) {
        lastError = error;

        // If it's an auth error and we haven't exhausted retries, try again
        if (this.isAuthError(error) && attempt < maxRetries) {
          console.log(`Elytro: Authentication error detected, retrying (attempt ${attempt + 1}/${maxRetries + 1})...`);
          continue;
        }

        // If it's not an auth error or we've exhausted retries, throw
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Clear auth session
   */
  public async clearAuthSession(): Promise<void> {
    const key = this.getSessionKey();
    if (key) {
      try {
        await chrome.storage.local.remove(key);
      } catch (error) {
        console.error('Elytro: Failed to clear auth session', error);
      }
    }
  }
  /**
   * Load security profile for current account
   */
  public async loadSecurityProfile(): Promise<TSecurityProfile | null> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      return null;
    }

    try {
      const sessionId = await this.getAuthSession();
      const result = await query<{
        walletSecurityProfile: TSecurityProfile;
      }>(query_wallet_security_profile, {
        input: {
          authSessionId: sessionId,
        },
      });

      return result.walletSecurityProfile;
    } catch (error) {
      console.error('Elytro: Failed to load security profile', error);
      // Don't throw if profile doesn't exist yet
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('not found')) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Request email binding
   */
  public async requestEmailBinding(email: string, locale = 'en-US'): Promise<TRequestEmailBindingResult> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const sessionId = await this.getAuthSession();
    const result = await mutate<{
      requestWalletEmailBinding: TRequestEmailBindingResult;
    }>(mutate_request_wallet_email_binding, {
      input: {
        authSessionId: sessionId,
        email,
        locale,
      },
    });

    return result.requestWalletEmailBinding;
  }

  /**
   * Confirm email binding with OTP
   */
  public async confirmEmailBinding(bindingId: string, otpCode: string): Promise<TSecurityProfile> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const sessionId = await this.getAuthSession();
    const result = await mutate<{
      confirmWalletEmailBinding: {
        email: string;
        emailVerified: boolean;
        maskedEmail: string;
        dailyLimitUsdCents: number;
        updatedAt: string;
      };
    }>(mutate_confirm_wallet_email_binding, {
      input: {
        authSessionId: sessionId,
        bindingId,
        otpCode,
      },
    });

    return {
      email: result.confirmWalletEmailBinding.email,
      emailVerified: result.confirmWalletEmailBinding.emailVerified,
      maskedEmail: result.confirmWalletEmailBinding.maskedEmail,
      dailyLimitUsdCents: result.confirmWalletEmailBinding.dailyLimitUsdCents,
      updatedAt: result.confirmWalletEmailBinding.updatedAt,
    };
  }

  /**
   * Set daily limit for current account
   */
  public async setDailyLimit(dailyLimitUsdCents: number): Promise<void> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const sessionId = await this.getAuthSession();
    await mutate<{
      setWalletDailyLimit: {
        dailyLimitUsdCents: number;
        updatedAt: string;
      };
    }>(mutate_set_wallet_daily_limit, {
      input: {
        authSessionId: sessionId,
        dailyLimitUsdCents,
      },
    });
  }

  /**
   * Request security OTP for a specific user operation
   * This proactively requests an escalation OTP before calling authorizeUserOperation
   */
  public async requestSecurityOtp(
    userOp: ElytroUserOperation,
    metadata?: {
      userAgent?: string;
      ip?: string;
      origin?: string;
      locale?: string;
    }
  ): Promise<{
    challengeId: string;
    maskedEmail: string;
    otpExpiresAt: string;
  }> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const entryPoint = this.getEntryPoint();
    if (!entryPoint) {
      throw new Error('No entry point available');
    }

    const sessionId = await this.loadAuthSession();

    // Format user operation
    const op = {
      sender: userOp.sender.toLowerCase(),
      nonce: formatHex(userOp.nonce),
      factory: userOp.factory?.toLowerCase() || null,
      factoryData: userOp.factoryData || '0x',
      callData: userOp.callData,
      callGasLimit: formatHex(userOp.callGasLimit),
      verificationGasLimit: formatHex(userOp.verificationGasLimit),
      preVerificationGas: formatHex(userOp.preVerificationGas),
      maxPriorityFeePerGas: formatHex(userOp.maxPriorityFeePerGas),
      maxFeePerGas: formatHex(userOp.maxFeePerGas),
      paymaster: userOp.paymaster?.toLowerCase() || null,
      paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit
        ? formatHex(userOp.paymasterVerificationGasLimit)
        : '0x0',
      paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit ? formatHex(userOp.paymasterPostOpGasLimit) : '0x0',
      paymasterData: userOp.paymasterData || '0x',
      signature: userOp.signature,
    };

    const result = await mutate<{
      requestSecurityOtp: {
        challengeId: string;
        maskedEmail: string;
        otpExpiresAt: string;
      };
    }>(mutate_request_security_otp, {
      input: {
        authSessionId: sessionId,
        chainID: toHex(currentAccount.chainId),
        entryPoint: entryPoint.toLowerCase(),
        op,
        ...(metadata && { metadata }),
      },
    });

    return result.requestSecurityOtp;
  }

  /**
   * Verify security OTP challenge
   * This completes an escalation challenge generated by authorizeUserOperation or requestSecurityOtp
   */
  public async verifySecurityOtp(
    challengeId: string,
    otpCode: string
  ): Promise<{
    challengeId: string;
    status: string;
    verifiedAt: string;
  }> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const sessionId = await this.loadAuthSession();
    console.log('test: verifySecurityOtp sessionId', sessionId);
    const result = await mutate<{
      verifySecurityOtp: {
        challengeId: string;
        status: string;
        verifiedAt: string;
      };
    }>(mutate_verify_security_otp, {
      input: {
        authSessionId: sessionId,
        challengeId,
        otpCode,
      },
    });

    return result.verifySecurityOtp;
  }

  /**
   * Get hook signature for a user operation
   * This method automatically handles authentication and retries
   */
  public async getHookSignature(userOp: ElytroUserOperation): Promise<{
    signature?: string;
    challengeId?: string;
    code?: string;
    currentSpendUsdCents?: number;
    dailyLimitUsdCents?: number;
    maskedEmail?: string;
    otpExpiresAt?: string;
    projectedSpendUsdCents?: number;
  }> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const entryPoint = this.getEntryPoint();
    if (!entryPoint) {
      throw new Error('No entry point available');
    }

    // Format user operation
    const op = {
      sender: userOp.sender.toLowerCase(),
      nonce: formatHex(userOp.nonce),
      factory: userOp.factory?.toLowerCase() || null,
      factoryData: userOp.factoryData || '0x',
      callData: userOp.callData,
      callGasLimit: formatHex(userOp.callGasLimit),
      verificationGasLimit: formatHex(userOp.verificationGasLimit),
      preVerificationGas: formatHex(userOp.preVerificationGas),
      maxPriorityFeePerGas: formatHex(userOp.maxPriorityFeePerGas),
      maxFeePerGas: formatHex(userOp.maxFeePerGas),
      paymaster: userOp.paymaster?.toLowerCase() || null,
      paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit
        ? formatHex(userOp.paymasterVerificationGasLimit)
        : '0x0',
      paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit ? formatHex(userOp.paymasterPostOpGasLimit) : '0x0',
      paymasterData: userOp.paymasterData || '0x',
      signature: userOp.signature,
    };

    // Retry with fresh authentication if needed
    let lastError: unknown;
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Clear session on retry (except first attempt)
        if (attempt > 0) {
          await this.clearAuthSession();
        }

        // Get or create authentication session
        const sessionId = await this.getAuthSession(maxRetries);

        // Call authorization mutation
        const result = await mutate<{
          authorizeUserOperation?: {
            decision: string;
            signature: string;
            spendDeltaUsdCents?: number;
            totalSpendUsdCents?: number;
            refreshedAt?: string;
          };
          extensions?: {
            challengeId: string;
            code: string;
            currentSpendUsdCents: number;
            dailyLimitUsdCents: number;
            maskedEmail: string;
            otpExpiresAt: string;
            projectedSpendUsdCents: number;
          };
        }>(mutate_authorize_user_operation, {
          input: {
            authSessionId: sessionId,
            chainID: toHex(currentAccount?.chainId),
            entryPoint: entryPoint.toLowerCase(),
            op,
          },
        });

        console.log('test: getHookSignature sessionId', sessionId);

        if (result?.extensions) {
          console.log('test: getHookSignature result.extensions', result.extensions);
          return result.extensions;
        }

        if (result?.authorizeUserOperation?.signature) {
          return {
            signature: result.authorizeUserOperation.signature,
          };
        }
        throw new Error('Elytro: Unknown error');
      } catch (error: unknown) {
        lastError = error;
        console.log('test: getHookSignature error', error);
      }
    }
    throw lastError;
  }

  /**
   * Change wallet email
   */
  public async changeWalletEmail(email: string, locale = 'en-US'): Promise<TRequestEmailBindingResult> {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      throw new Error('No current account');
    }

    const sessionId = await this.getAuthSession();
    const result = await mutate<{
      requestChangeWalletEmail: TRequestEmailBindingResult;
    }>(mutate_change_email, {
      input: {
        authSessionId: sessionId,
        email,
        locale,
      },
    });

    if (!result.requestChangeWalletEmail) {
      throw new Error('Failed to change wallet email');
    }

    return result.requestChangeWalletEmail;
  }
}

export default SecurityHookService;
