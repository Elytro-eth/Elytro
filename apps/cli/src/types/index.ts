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
  /** 1 = PBKDF2 password-based, 2 = raw device key. Absent treated as 1. */
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
  /** Pimlico API key */
  pimlicoKey?: string;
  /** Alchemy API key */
  alchemyKey?: string;
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

// ─── Nullable helper ────────────────────────────────────────────────

export type Nullable<T> = T | null | undefined;
