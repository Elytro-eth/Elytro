import type { Address, Hex } from 'viem';
import {
  toHex,
  toBytes,
  parseAbi,
  keccak256,
  hashMessage,
  encodeAbiParameters,
  encodePacked,
  parseAbiParameters,
} from 'viem';
import type { ElytroUserOperation, HookStatus, SecurityProfile, HookError, StorageAdapter } from '../types';
import { SECURITY_HOOK_ADDRESS_MAP } from '../constants/securityHook';
import { requestGraphQL, GraphQLClientError } from '../utils/graphqlClient';

// ─── EIP-1271 / EIP-712 Constants ─────────────────────────────────
// Mirrors extension's constants/sdk-config.ts

const ELYTRO_MSG_TYPE_HASH = keccak256(toBytes('ElytroMessage(bytes32 message)'));
const DOMAIN_SEPARATOR_TYPE_HASH: Hex = '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218';
// keccak256(toBytes('EIP712Domain(uint256 chainId,address verifyingContract)'))

export function getEncoded1271MessageHash(message: Hex): Hex {
  return keccak256(encodeAbiParameters(parseAbiParameters(['bytes32', 'bytes32']), [ELYTRO_MSG_TYPE_HASH, message]));
}

export function getDomainSeparator(chainIdHex: Hex, walletAddress: Hex): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters(['bytes32', 'uint256', 'address']), [
      DOMAIN_SEPARATOR_TYPE_HASH,
      BigInt(chainIdHex),
      walletAddress,
    ])
  );
}

export function getEncodedSHA(domainSeparator: Hex, encode1271MessageHash: Hex): Hex {
  return keccak256(
    encodePacked(['bytes1', 'bytes1', 'bytes32', 'bytes32'], ['0x19', '0x01', domainSeparator, encode1271MessageHash])
  );
}

// ─── GraphQL Operation Strings ────────────────────────────────────

const GQL_REQUEST_WALLET_AUTH_CHALLENGE = `
  mutation RequestWalletAuthChallenge($input: RequestWalletAuthChallengeInput!) {
    requestWalletAuthChallenge(input: $input) {
      challengeId
      message
      expiresAt
    }
  }
`;

const GQL_CONFIRM_WALLET_AUTH_CHALLENGE = `
  mutation ConfirmWalletAuthChallenge($input: ConfirmWalletAuthChallengeInput!) {
    confirmWalletAuthChallenge(input: $input) {
      sessionId
      expiresAt
    }
  }
`;

const GQL_WALLET_SECURITY_PROFILE = `
  query WalletSecurityProfile($input: WalletSecurityProfileInput!) {
    walletSecurityProfile(input: $input) {
      email
      emailVerified
      maskedEmail
      dailyLimitUsdCents
      createdAt
      updatedAt
    }
  }
`;

const GQL_REQUEST_WALLET_EMAIL_BINDING = `
  mutation RequestWalletEmailBinding($input: RequestWalletEmailBindingInput!) {
    requestWalletEmailBinding(input: $input) {
      bindingId
      maskedEmail
      otpExpiresAt
      resendAvailableAt
    }
  }
`;

const GQL_CONFIRM_WALLET_EMAIL_BINDING = `
  mutation ConfirmWalletEmailBinding($input: ConfirmWalletEmailBindingInput!) {
    confirmWalletEmailBinding(input: $input) {
      email
      emailVerified
      maskedEmail
      dailyLimitUsdCents
      updatedAt
    }
  }
`;

const GQL_CHANGE_WALLET_EMAIL = `
  mutation RequestChangeWalletEmail($input: ChangeWalletEmailInput!) {
    requestChangeWalletEmail(input: $input) {
      bindingId
      maskedEmail
      otpExpiresAt
      resendAvailableAt
    }
  }
`;

const GQL_SET_WALLET_DAILY_LIMIT = `
  mutation SetWalletDailyLimit($input: SetWalletDailyLimitInput!) {
    setWalletDailyLimit(input: $input) {
      dailyLimitUsdCents
      updatedAt
    }
  }
`;

const GQL_REQUEST_DAILY_LIMIT_OTP = `
  mutation RequestChangeWalletDailyLimit($input: RequestWalletDailyLimitInput!) {
    requestChangeWalletDailyLimit(input: $input) {
      maskedEmail
      otpExpiresAt
      resendAvailableAt
    }
  }
`;

const GQL_AUTHORIZE_USER_OPERATION = `
  mutation AuthorizeUserOperation($input: AuthorizeUserOperationInput!) {
    authorizeUserOperation(input: $input) {
      decision
      signature
      spendDeltaUsdCents
      totalSpendUsdCents
      refreshedAt
    }
  }
`;

const GQL_REQUEST_SECURITY_OTP = `
  mutation RequestSecurityOtp($input: RequestSecurityOtpInput!) {
    requestSecurityOtp(input: $input) {
      challengeId
      maskedEmail
      otpExpiresAt
    }
  }
`;

const GQL_VERIFY_SECURITY_OTP = `
  mutation VerifySecurityOtp($input: VerifySecurityOtpInput!) {
    verifySecurityOtp(input: $input) {
      challengeId
      status
      verifiedAt
    }
  }
`;

// ─── Minimal ABIs for on-chain queries ────────────────────────────

const ABI_LIST_HOOK = parseAbi([
  'function listHook() view returns (address[] preIsValidSignatureHooks, address[] preUserOpValidationHooks)',
]);

const ABI_SECURITY_HOOK_USER_DATA = parseAbi([
  'function userData(address) view returns (bool initialized, uint32 safetyDelay, uint64 forceUninstallAfter)',
]);

// ─── Types ────────────────────────────────────────────────────────

interface AuthSession {
  authSessionId: string;
  expiresAt: number; // unix ms
}

export interface EmailBindingResult {
  bindingId: string;
  maskedEmail: string;
  otpExpiresAt: string;
  resendAvailableAt: string;
}

export interface HookSignatureResult {
  /** Hook signature — present when authorization is approved */
  signature?: string;
  /** Error details — present when OTP/limit challenge is required */
  error?: HookError;
}

/**
 * Signs a message for EIP-1271 auth challenge.
 *
 * Must perform the full EIP-712 flow:
 * 1. hashMessage(raw message) → EIP-191 hash
 * 2. Encode with ElytroMessage type hash + domain separator
 * 3. packRawHash → raw sign → packUserOpEOASignature (with validator)
 *
 * @param message  Raw challenge message (hex bytes)
 * @param walletAddress  Smart account address (for domain separator)
 * @param chainId  Chain ID (for domain separator)
 * @returns Packed signature (validator + rawSig + validationData)
 */
export type SignMessageForAuthFn = (message: Hex, walletAddress: Address, chainId: number) => Promise<Hex>;

type ReadContractFn = (params: {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args?: unknown[];
}) => Promise<unknown>;
type GetBlockTimestampFn = () => Promise<bigint>;

// ─── Factory for signMessageForAuth ──────────────────────────────

/**
 * Create a `signMessageForAuth` callback that performs the full EIP-1271/EIP-712 signing flow.
 *
 * This replicates the extension's `signMessage()` path (sdk.ts):
 * 1. hashMessage({ raw: message })                      — EIP-191 hash
 * 2. getEncoded1271MessageHash(hashedMessage)            — type hash wrap
 * 3. getDomainSeparator(chainIdHex, walletAddress)       — EIP-712 domain
 * 4. getEncodedSHA(domainSeparator, encoded1271Hash)     — final hash
 * 5. sdk.packRawHash(finalHash)                          — packed hash + validationData
 * 6. keyring.signDigest(packedHash)                      — raw ECDSA sign
 * 7. sdk.packUserOpSignature(rawSig, validationData)     — validator-packed signature
 *
 * @param deps.signDigest   Raw ECDSA sign (keyring.signDigest)
 * @param deps.packRawHash  SDK packRawHash (hash → packedHash + validationData)
 * @param deps.packSignature SDK packUserOpSignature (rawSig, validationData → packed)
 */
export function createSignMessageForAuth(deps: {
  signDigest: (digest: Hex) => Promise<Hex>;
  packRawHash: (hash: Hex) => Promise<{ packedHash: Hex; validationData: Hex }>;
  packSignature: (rawSignature: Hex, validationData: Hex) => Promise<Hex>;
}): SignMessageForAuthFn {
  return async (message: Hex, walletAddress: Address, chainId: number): Promise<Hex> => {
    // 1. EIP-191 hash of raw message
    const hashedMessage = hashMessage({ raw: toBytes(message) });

    // 2. Wrap with ElytroMessage type hash
    const encoded1271Hash = getEncoded1271MessageHash(hashedMessage);

    // 3. Build EIP-712 domain separator
    const chainIdHex = `0x${chainId.toString(16)}` as Hex;
    const domainSeparator = getDomainSeparator(chainIdHex, walletAddress.toLowerCase() as Hex);

    // 4. Final EIP-712 structured hash
    const messageHash = getEncodedSHA(domainSeparator, encoded1271Hash);

    // 5. Pack raw hash (adds validation time bounds)
    const { packedHash, validationData } = await deps.packRawHash(messageHash);

    // 6. Raw ECDSA sign
    const rawSignature = await deps.signDigest(packedHash);

    // 7. Pack with validator
    return deps.packSignature(rawSignature, validationData);
  };
}

// ─── Service ──────────────────────────────────────────────────────

/**
 * SecurityHookService — manages SecurityHook operations for the CLI.
 *
 * Ported from extension's SecurityHookService + SDK hook methods.
 *
 * Responsibilities:
 * 1. Challenge-response authentication (signMessage → sessionId)
 * 2. Auth session persistence via FileStore
 * 3. On-chain hook status queries (listHook + userData)
 * 4. Security profile loading (GraphQL)
 * 5. Email binding & change
 * 6. Daily spending limit management
 * 7. UserOp authorization (getHookSignature) with OTP flow
 * 8. Hook-aware signature packing (packUserOpEOASignature with hookInputData)
 */
export class SecurityHookService {
  private store: StorageAdapter;
  private graphqlEndpoint: string;
  private signMessageForAuth: SignMessageForAuthFn;
  private readContract: ReadContractFn;
  private getBlockTimestamp: GetBlockTimestampFn;

  /**
   * In-memory cache of the last authenticated session ID.
   * Prevents re-authentication between getHookSignature → verifySecurityOtp
   * calls, which would create a new session that doesn't own the OTP challenge.
   */
  private _cachedSessionId: string | null = null;

  constructor(deps: {
    store: StorageAdapter;
    graphqlEndpoint: string;
    signMessageForAuth: SignMessageForAuthFn;
    readContract: ReadContractFn;
    getBlockTimestamp: GetBlockTimestampFn;
  }) {
    this.store = deps.store;
    this.graphqlEndpoint = deps.graphqlEndpoint;
    this.signMessageForAuth = deps.signMessageForAuth;
    this.readContract = deps.readContract;
    this.getBlockTimestamp = deps.getBlockTimestamp;
  }

  // ─── Auth Session ─────────────────────────────────────────────

  private sessionKey(walletAddress: Address, chainId: number): string {
    return `authSession_${walletAddress.toLowerCase()}_${chainId}`;
  }

  private async loadAuthSession(walletAddress: Address, chainId: number): Promise<string | null> {
    const key = this.sessionKey(walletAddress, chainId);
    const session = await this.store.load<AuthSession>(key);

    if (!session) return null;

    // Check expiry
    if (Date.now() > session.expiresAt) {
      await this.store.remove(key);
      return null;
    }

    return session.authSessionId;
  }

  private async storeAuthSession(
    walletAddress: Address,
    chainId: number,
    sessionId: string,
    expiresAt: string
  ): Promise<void> {
    const key = this.sessionKey(walletAddress, chainId);
    await this.store.save<AuthSession>(key, {
      authSessionId: sessionId,
      expiresAt: new Date(expiresAt).getTime(),
    });
  }

  async clearAuthSession(walletAddress: Address, chainId: number): Promise<void> {
    this._cachedSessionId = null;
    const key = this.sessionKey(walletAddress, chainId);
    await this.store.remove(key);
  }

  /**
   * Authenticate wallet via challenge-response.
   *
   * Flow: requestWalletAuthChallenge → sign challenge message → confirmWalletAuthChallenge → sessionId.
   */
  async authenticate(walletAddress: Address, chainId: number): Promise<string> {
    const challengeResult = await this.gqlMutate<{
      requestWalletAuthChallenge: {
        challengeId: string;
        message: string;
        expiresAt: string;
      };
    }>(GQL_REQUEST_WALLET_AUTH_CHALLENGE, {
      input: {
        chainID: `0x${chainId.toString(16)}`,
        address: walletAddress.toLowerCase(),
      },
    });

    const challenge = challengeResult.requestWalletAuthChallenge;

    // Sign the challenge message using the full EIP-1271 flow.
    // The backend verifies by calling isValidSignature on the smart account,
    // which expects a packed signature (validator + rawSig + validationData).
    const signature = await this.signMessageForAuth(toHex(challenge.message) as Hex, walletAddress, chainId);

    const confirmResult = await this.gqlMutate<{
      confirmWalletAuthChallenge: {
        sessionId: string;
        expiresAt: string;
      };
    }>(GQL_CONFIRM_WALLET_AUTH_CHALLENGE, {
      input: {
        chainID: `0x${chainId.toString(16)}`,
        address: walletAddress.toLowerCase(),
        challengeId: challenge.challengeId,
        signature,
      },
    });

    const { sessionId, expiresAt } = confirmResult.confirmWalletAuthChallenge;
    await this.storeAuthSession(walletAddress, chainId, sessionId, expiresAt);

    return sessionId;
  }

  /**
   * Get or create an auth session, with one retry on auth errors.
   * Caches the session ID in-memory so subsequent calls within the same
   * service instance (e.g. verifySecurityOtp after getHookSignature)
   * always use the same session.
   */
  async getAuthSession(walletAddress: Address, chainId: number): Promise<string> {
    // Try in-memory cache first (fastest, avoids file I/O)
    if (this._cachedSessionId) return this._cachedSessionId;

    // Try file-persisted session
    let sessionId = await this.loadAuthSession(walletAddress, chainId);
    if (sessionId) {
      this._cachedSessionId = sessionId;
      return sessionId;
    }

    // Authenticate fresh
    try {
      sessionId = await this.authenticate(walletAddress, chainId);
      this._cachedSessionId = sessionId;
      return sessionId;
    } catch (err) {
      // One retry: clear and re-auth
      if (this.isAuthError(err)) {
        await this.clearAuthSession(walletAddress, chainId);
        sessionId = await this.authenticate(walletAddress, chainId);
        this._cachedSessionId = sessionId;
        return sessionId;
      }
      throw err;
    }
  }

  private isAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const msg = String((error as { message?: string }).message ?? '').toLowerCase();
    return (
      msg.includes('forbidden') ||
      msg.includes('unauthorized') ||
      msg.includes('session') ||
      msg.includes('expired') ||
      msg.includes('failed to authenticate')
    );
  }

  // ─── On-chain Hook Status ────────────────────────────────────

  /**
   * Query on-chain hook status: which hooks are installed + force-uninstall state.
   */
  async getHookStatus(walletAddress: Address, chainId: number): Promise<HookStatus> {
    const hookAddress = SECURITY_HOOK_ADDRESS_MAP[chainId];

    if (!hookAddress) {
      return {
        installed: false,
        hookAddress: '0x0000000000000000000000000000000000000000' as Address,
        capabilities: { preUserOpValidation: false, preIsValidSignature: false },
        forceUninstall: { initiated: false, canExecute: false, availableAfter: null },
      };
    }

    try {
      // 1) Query listHook on the wallet
      const hooks = (await this.readContract({
        address: walletAddress,
        abi: ABI_LIST_HOOK as unknown as readonly unknown[],
        functionName: 'listHook',
      })) as [Address[], Address[]];

      const [preIsValidSignatureHooks, preUserOpValidationHooks] = Array.isArray(hooks) ? hooks : [[], []];

      const hookLower = hookAddress.toLowerCase();
      const hasPreIsValidSignature = preIsValidSignatureHooks.some((h) => h.toLowerCase() === hookLower);
      const hasPreUserOpValidation = preUserOpValidationHooks.some((h) => h.toLowerCase() === hookLower);
      const installed = hasPreIsValidSignature || hasPreUserOpValidation;

      // 2) Query userData on the SecurityHook contract
      let forceUninstall = { initiated: false, canExecute: false, availableAfter: null as string | null };

      if (installed) {
        try {
          const userData = (await this.readContract({
            address: hookAddress,
            abi: ABI_SECURITY_HOOK_USER_DATA as unknown as readonly unknown[],
            functionName: 'userData',
            args: [walletAddress],
          })) as [boolean, number, bigint];

          const [_isInstalled, _safetyDelay, forceUninstallAfterRaw] = userData;
          const forceUninstallAfter = Number(forceUninstallAfterRaw);

          if (forceUninstallAfter > 0) {
            const currentTimestamp = Number(await this.getBlockTimestamp());
            forceUninstall = {
              initiated: true,
              canExecute: currentTimestamp >= forceUninstallAfter,
              availableAfter: new Date(forceUninstallAfter * 1000).toISOString(),
            };
          }
        } catch {
          // userData query failed — hook may be in unexpected state
        }
      }

      return {
        installed,
        hookAddress,
        capabilities: {
          preUserOpValidation: hasPreUserOpValidation,
          preIsValidSignature: hasPreIsValidSignature,
        },
        forceUninstall,
      };
    } catch {
      // listHook failed — wallet may not be deployed yet
      return {
        installed: false,
        hookAddress,
        capabilities: { preUserOpValidation: false, preIsValidSignature: false },
        forceUninstall: { initiated: false, canExecute: false, availableAfter: null },
      };
    }
  }

  // ─── Security Profile ────────────────────────────────────────

  /**
   * Load security profile from backend (email, dailyLimit, etc.).
   */
  async loadSecurityProfile(walletAddress: Address, chainId: number): Promise<SecurityProfile | null> {
    try {
      const sessionId = await this.getAuthSession(walletAddress, chainId);
      const result = await this.gqlQuery<{
        walletSecurityProfile: SecurityProfile;
      }>(GQL_WALLET_SECURITY_PROFILE, {
        input: { authSessionId: sessionId },
      });

      return result.walletSecurityProfile;
    } catch (err) {
      // Profile doesn't exist yet → return null
      const msg = String((err as { message?: string }).message ?? '');
      if (msg.includes('NOT_FOUND') || msg.includes('not found')) {
        return null;
      }
      throw err;
    }
  }

  // ─── Email Binding ───────────────────────────────────────────

  /**
   * Request email binding — sends OTP to the provided email.
   */
  async requestEmailBinding(walletAddress: Address, chainId: number, email: string): Promise<EmailBindingResult> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    const result = await this.gqlMutate<{
      requestWalletEmailBinding: EmailBindingResult;
    }>(GQL_REQUEST_WALLET_EMAIL_BINDING, {
      input: { authSessionId: sessionId, email, locale: 'en-US' },
    });

    return result.requestWalletEmailBinding;
  }

  /**
   * Confirm email binding with OTP code.
   */
  async confirmEmailBinding(
    walletAddress: Address,
    chainId: number,
    bindingId: string,
    otpCode: string
  ): Promise<SecurityProfile> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    const result = await this.gqlMutate<{
      confirmWalletEmailBinding: {
        email: string;
        emailVerified: boolean;
        maskedEmail: string;
        dailyLimitUsdCents: number;
        updatedAt: string;
      };
    }>(GQL_CONFIRM_WALLET_EMAIL_BINDING, {
      input: { authSessionId: sessionId, bindingId, otpCode },
    });

    return result.confirmWalletEmailBinding;
  }

  /**
   * Request email change — sends OTP to the new email.
   */
  async changeWalletEmail(walletAddress: Address, chainId: number, email: string): Promise<EmailBindingResult> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    const result = await this.gqlMutate<{
      requestChangeWalletEmail: EmailBindingResult;
    }>(GQL_CHANGE_WALLET_EMAIL, {
      input: { authSessionId: sessionId, email, locale: 'en-US' },
    });

    return result.requestChangeWalletEmail;
  }

  // ─── Daily Spending Limit ────────────────────────────────────

  /**
   * Request OTP for changing daily limit.
   */
  async requestDailyLimitOtp(
    walletAddress: Address,
    chainId: number,
    dailyLimitUsdCents: number
  ): Promise<{ maskedEmail: string; otpExpiresAt: string }> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    const result = await this.gqlMutate<{
      requestChangeWalletDailyLimit: {
        maskedEmail: string;
        otpExpiresAt: string;
        resendAvailableAt: string;
      };
    }>(GQL_REQUEST_DAILY_LIMIT_OTP, {
      input: { authSessionId: sessionId, dailyLimitUsdCents },
    });

    return result.requestChangeWalletDailyLimit;
  }

  /**
   * Set daily spending limit (with optional OTP code for confirmation).
   */
  async setDailyLimit(
    walletAddress: Address,
    chainId: number,
    dailyLimitUsdCents: number,
    otpCode?: string
  ): Promise<void> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    await this.gqlMutate<{
      setWalletDailyLimit: { dailyLimitUsdCents: number; updatedAt: string };
    }>(GQL_SET_WALLET_DAILY_LIMIT, {
      input: { authSessionId: sessionId, dailyLimitUsdCents, ...(otpCode && { otpCode }) },
    });
  }

  // ─── OTP ─────────────────────────────────────────────────────

  /**
   * Request a security OTP for a user operation (proactive escalation).
   */
  async requestSecurityOtp(
    walletAddress: Address,
    chainId: number,
    entryPoint: Address,
    userOp: ElytroUserOperation
  ): Promise<{ challengeId: string; maskedEmail: string; otpExpiresAt: string }> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);
    const op = this.formatUserOpForGraphQL(userOp);

    const result = await this.gqlMutate<{
      requestSecurityOtp: {
        challengeId: string;
        maskedEmail: string;
        otpExpiresAt: string;
      };
    }>(GQL_REQUEST_SECURITY_OTP, {
      input: {
        authSessionId: sessionId,
        chainID: toHex(chainId),
        entryPoint: entryPoint.toLowerCase(),
        op,
      },
    });

    return result.requestSecurityOtp;
  }

  /**
   * Verify a security OTP challenge.
   */
  async verifySecurityOtp(
    walletAddress: Address,
    chainId: number,
    challengeId: string,
    otpCode: string
  ): Promise<{ challengeId: string; status: string; verifiedAt: string }> {
    const sessionId = await this.getAuthSession(walletAddress, chainId);

    const result = await this.gqlMutate<{
      verifySecurityOtp: {
        challengeId: string;
        status: string;
        verifiedAt: string;
      };
    }>(GQL_VERIFY_SECURITY_OTP, {
      input: { authSessionId: sessionId, challengeId, otpCode },
    });

    return result.verifySecurityOtp;
  }

  // ─── UserOp Authorization ────────────────────────────────────

  /**
   * Get hook signature for a user operation.
   *
   * Returns either:
   * - { signature } on success
   * - { error } when OTP/spending-limit challenge is required
   *
   * Handles auth retry automatically.
   */
  async getHookSignature(
    walletAddress: Address,
    chainId: number,
    entryPoint: Address,
    userOp: ElytroUserOperation
  ): Promise<HookSignatureResult> {
    const op = this.formatUserOpForGraphQL(userOp);

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        if (attempt > 0) {
          await this.clearAuthSession(walletAddress, chainId);
        }

        const sessionId = await this.getAuthSession(walletAddress, chainId);

        const result = await this.gqlRaw<{
          authorizeUserOperation?: {
            decision: string;
            signature: string;
            spendDeltaUsdCents?: number;
            totalSpendUsdCents?: number;
            refreshedAt?: string;
          };
        }>(GQL_AUTHORIZE_USER_OPERATION, {
          input: {
            authSessionId: sessionId,
            chainID: toHex(chainId),
            entryPoint: entryPoint.toLowerCase(),
            op,
          },
        });

        // Success: signature returned
        if (result.data?.authorizeUserOperation?.signature) {
          return { signature: result.data.authorizeUserOperation.signature };
        }

        // Challenge required: OTP_REQUIRED, SPENDING_LIMIT_EXCEEDED, etc.
        if (result.errors && result.errors.length > 0) {
          const ext = result.errors[0].extensions as Record<string, unknown> | undefined;
          if (ext) {
            return {
              error: {
                code: ext.code as string,
                challengeId: ext.challengeId as string,
                currentSpendUsdCents: ext.currentSpendUsdCents as number,
                dailyLimitUsdCents: ext.dailyLimitUsdCents as number,
                maskedEmail: ext.maskedEmail as string,
                otpExpiresAt: ext.otpExpiresAt as string,
                projectedSpendUsdCents: ext.projectedSpendUsdCents as number,
                message: result.errors[0].message,
              },
            };
          }
        }

        throw new Error('Unknown authorization error');
      } catch (err) {
        // If it's an auth error and first attempt, retry
        if (this.isAuthError(err) && attempt === 0) continue;

        // If it's a GraphQL error with extensions (OTP challenge), parse it
        if (err instanceof GraphQLClientError && err.errors?.length) {
          const ext = err.errors[0].extensions as Record<string, unknown> | undefined;
          if (ext?.code) {
            return {
              error: {
                code: ext.code as string,
                challengeId: ext.challengeId as string,
                currentSpendUsdCents: ext.currentSpendUsdCents as number,
                dailyLimitUsdCents: ext.dailyLimitUsdCents as number,
                maskedEmail: ext.maskedEmail as string,
                otpExpiresAt: ext.otpExpiresAt as string,
                projectedSpendUsdCents: ext.projectedSpendUsdCents as number,
                message: err.errors[0].message,
              },
            };
          }
        }

        throw err;
      }
    }

    throw new Error('Hook signature authorization failed after retry');
  }

  // ─── Helpers ─────────────────────────────────────────────────

  /**
   * Format UserOp fields for GraphQL input (all values as hex strings).
   */
  private formatUserOpForGraphQL(userOp: ElytroUserOperation): Record<string, unknown> {
    return {
      sender: userOp.sender.toLowerCase(),
      nonce: this.formatHex(userOp.nonce),
      factory: userOp.factory?.toLowerCase() || null,
      factoryData: userOp.factoryData || '0x',
      callData: userOp.callData,
      callGasLimit: this.formatHex(userOp.callGasLimit),
      verificationGasLimit: this.formatHex(userOp.verificationGasLimit),
      preVerificationGas: this.formatHex(userOp.preVerificationGas),
      maxPriorityFeePerGas: this.formatHex(userOp.maxPriorityFeePerGas),
      maxFeePerGas: this.formatHex(userOp.maxFeePerGas),
      paymaster: userOp.paymaster?.toLowerCase() || null,
      paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit
        ? this.formatHex(userOp.paymasterVerificationGasLimit)
        : '0x0',
      paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit ? this.formatHex(userOp.paymasterPostOpGasLimit) : '0x0',
      paymasterData: userOp.paymasterData || '0x',
      signature: userOp.signature,
    };
  }

  /**
   * Convert a value to hex string. If already a hex string, return as-is.
   * Mirrors extension's formatHex utility.
   */
  private formatHex(value: string | number | bigint): string {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value;
    }
    return toHex(value);
  }

  // ─── GraphQL Wrappers ───────────────────────────────────────

  private async gqlMutate<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    return requestGraphQL<T>({
      endpoint: this.graphqlEndpoint,
      query,
      variables,
    });
  }

  private async gqlQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    return requestGraphQL<T>({
      endpoint: this.graphqlEndpoint,
      query,
      variables,
    });
  }

  /**
   * Raw GraphQL request that returns the full response (data + errors)
   * instead of throwing on errors. Needed for authorizeUserOperation
   * which uses GraphQL errors with extensions for challenge responses.
   */
  private async gqlRaw<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<{ data?: T; errors?: Array<{ message: string; extensions?: Record<string, unknown> }> }> {
    const { endpoint } = { endpoint: this.graphqlEndpoint };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      return (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
