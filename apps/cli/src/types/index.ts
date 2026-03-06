import type { Address, Hex } from 'viem';

// ─── Account ────────────────────────────────────────────────────────

export interface AccountInfo {
  /** Smart account contract address */
  address: Address;
  /** Chain ID this account is deployed on (or will be) */
  chainId: number;
  /** Human-readable alias (e.g. "swift-panda") */
  alias: string;
  /** EOA owner address — internal only, never exposed to user */
  owner: Address;
  /** CREATE2 index — allows multiple accounts per owner per chain */
  index: number;
  /** Whether the smart contract has been deployed on-chain */
  isDeployed: boolean;
  /** Whether social recovery guardians have been set */
  isRecoveryEnabled: boolean;
}

// ─── Keyring ────────────────────────────────────────────────────────

export interface OwnerKey {
  /** EOA address derived from the private key */
  id: Address;
  /** Hex-encoded private key (stored encrypted on disk) */
  key: Hex;
}

export interface VaultData {
  owners: OwnerKey[];
  currentOwnerId: Address;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  /** 1 = PBKDF2 password-based, 2 = raw vault key (via SecretProvider). Absent treated as 1. */
  version?: 1 | 2;
}

// ─── Chain ──────────────────────────────────────────────────────────

export interface ChainConfig {
  id: number;
  name: string;
  /** RPC endpoint URL */
  endpoint: string;
  /** Pimlico bundler URL */
  bundler: string;
  /** Native currency symbol */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Block explorer URL */
  blockExplorer?: string;
  /** Stablecoin definitions for this chain */
  stablecoins?: { name: string; address: string[] }[];
}

// ─── Config ─────────────────────────────────────────────────────────

export interface CliConfig {
  /** Currently selected chain ID */
  currentChainId: number;
  /** Available chains */
  chains: ChainConfig[];
  /** GraphQL API endpoint */
  graphqlEndpoint: string;
}

/** User-configured API keys persisted in ~/.elytro/user-keys.json */
export interface UserKeys {
  /** Alchemy API key — unlocks higher RPC rate limits */
  alchemyKey?: string;
  /** Pimlico API key — unlocks higher bundler rate limits */
  pimlicoKey?: string;
}

// ─── Storage ────────────────────────────────────────────────────────

export interface StorageAdapter {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, data: T): Promise<void>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ─── UserOperation (ERC-4337) ───────────────────────────────────────

export interface ElytroUserOperation {
  sender: Address;
  nonce: bigint;
  factory: Address | null;
  factoryData: Hex | null;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymaster: Address | null;
  paymasterVerificationGasLimit: bigint | null;
  paymasterPostOpGasLimit: bigint | null;
  paymasterData: Hex | null;
  signature: Hex;
}

// ─── Sponsor ────────────────────────────────────────────────────────

export interface SponsorResult {
  paymaster: Address;
  paymasterData: Hex;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  paymasterVerificationGasLimit?: string;
  paymasterPostOpGasLimit?: string;
}

// ─── UserOp Receipt ─────────────────────────────────────────────────

export interface UserOpReceipt {
  userOpHash: Hex;
  entryPoint: Address;
  sender: Address;
  nonce: string;
  paymaster?: Address;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  reason?: string;
  receipt?: {
    transactionHash: Hex;
    blockNumber: string;
    blockHash: Hex;
    gasUsed: string;
  };
}

// ─── Security Hook ─────────────────────────────────────────────────

export interface HookStatus {
  installed: boolean;
  hookAddress: Address;
  capabilities: {
    preUserOpValidation: boolean;
    preIsValidSignature: boolean;
  };
  forceUninstall: {
    initiated: boolean;
    canExecute: boolean;
    /** ISO timestamp or null */
    availableAfter: string | null;
  };
}

export interface SecurityProfile {
  email?: string;
  emailVerified?: boolean;
  maskedEmail?: string;
  dailyLimitUsdCents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HookError {
  code?: string;
  challengeId?: string;
  currentSpendUsdCents?: number;
  dailyLimitUsdCents?: number;
  maskedEmail?: string;
  otpExpiresAt?: string;
  projectedSpendUsdCents?: number;
  message?: string;
}

// ─── Social Recovery ──────────────────────────────────────────────────

export type TRecoveryContact = {
  /** Optional human-readable label for the guardian */
  label?: string;
  /** Guardian EOA address */
  address: string;
  /** Whether this guardian has signed the approval hash */
  confirmed?: boolean;
};

export type TRecoveryContactsInfo = {
  /** Salt used when computing the guardian hash (bytes32) */
  salt: string;
  /** Minimum number of guardian signatures required */
  threshold: number;
  /** Array of guardian addresses */
  contacts: string[];
};

export type TRecoveryRecord = Omit<TRecoveryContactsInfo, 'contacts'> & {
  /** Smart account address being recovered */
  address: string;
  /** Chain ID of the smart account */
  chainId: number;
  /** EIP-712 typed data hash that guardians must sign */
  approveHash: string;
  /** On-chain recovery operation ID (keccak256 of packed params) */
  recoveryID: string;
  /** List of guardian addresses that have already signed */
  signedGuardians: string[];
  /** Current recovery status (RecoveryStatusEn) */
  status: number;
  /** Block number from which to start scanning for ApproveHash events */
  fromBlock: string;
  /** Contacts with confirmation state */
  contacts: TRecoveryContact[];
  /** New owner address for recovery */
  owner: string;
};

export type RecoveryInfo = {
  /** On-chain guardian hash (bytes32) */
  contactsHash: string;
  /** Recovery nonce — increments after each recovery */
  nonce: bigint;
  /** Time delay (seconds) before recovery can be finalized */
  delayPeriod: bigint;
};

export enum RecoveryStatusEn {
  /** UX-only: waiting for guardians to sign approveHash off-chain */
  WAITING_FOR_SIGNATURE = 9,
  /** On-chain: Unset — enough signatures collected, ready to submit */
  SIGNATURE_COMPLETED = 0,
  /** On-chain: Waiting — recovery submitted, delay period active */
  RECOVERY_STARTED = 1,
  /** On-chain: Ready — delay period elapsed, can finalize */
  RECOVERY_READY = 2,
  /** On-chain: Done — recovery finalized, new owner active */
  RECOVERY_COMPLETED = 3,
}

// ─── Nullable helper ────────────────────────────────────────────────

export type Nullable<T> = T | null | undefined;
