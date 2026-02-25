import type { Address, Hex } from 'viem';
import { padHex } from 'viem';
import type { ChainConfig } from '../types';
import { ElytroWallet } from '@elytro/sdk';

/**
 * SDKService — @elytro/sdk wrapper for ERC-4337 operations.
 *
 * Phase 1: address calculation for account creation.
 * Phase 2: full UserOp lifecycle (sign, send, estimate).
 */

/** Default guardian hash when no guardians are set. */
const DEFAULT_GUARDIAN_HASH = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

/** Default guardian safe period: 48 hours. */
const DEFAULT_GUARDIAN_SAFE_PERIOD = 172800;

/**
 * Contract addresses per entrypoint version.
 * Mirrors extension's constants/entrypoints.ts.
 */
const ENTRYPOINT_CONFIGS: Record<string, SDKContractConfig> = {
  'v0.7': {
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    factory: '0x70B616f23bDDB18c5c412dB367568Dc360e224Bb',
    fallback: '0xe4eA02c80C3CD86B2f23c8158acF2AAFcCa5A6b3',
    recovery: '0x36693563E41BcBdC8d295bD3C2608eb7c32b1cCb',
    validator: '0x162485941bA1FAF21013656DAB1E60e9D7226DC0',
    elytroWalletLogic: '0x186b91aE45dd22dEF329BF6b4233cf910E157C84',
  },
  'v0.8': {
    entryPoint: '0x4337084d9e255ff0702461cf8895ce9e3b5ff108',
    factory: '0x82a8B1a5986f565a1546672e8939daA1b20F441E',
    fallback: '0xB73Ec2FD0189202F6C22067Eeb19EAad25CAB551',
    recovery: '0xAFEF5D8Fb7b4650B1724a23e40633f720813c731',
    validator: '0xea50a2874df3eEC9E0365425ba948989cd63FED6',
    elytroWalletLogic: '0x2CC8A41e26dAC15F1D11F333f74D0451be6caE36',
  },
};

const DEFAULT_VERSION = 'v0.8';

interface SDKContractConfig {
  entryPoint: string;
  factory: string;
  fallback: string;
  recovery: string;
  validator: string;
  elytroWalletLogic: string;
}

export class SDKService {
  private sdk: ElytroWallet | null = null;
  private chainConfig: ChainConfig | null = null;
  private contractConfig: SDKContractConfig = ENTRYPOINT_CONFIGS[DEFAULT_VERSION];

  async initForChain(chainConfig: ChainConfig, entrypointVersion: string = DEFAULT_VERSION): Promise<void> {
    this.chainConfig = chainConfig;
    this.contractConfig = ENTRYPOINT_CONFIGS[entrypointVersion] ?? ENTRYPOINT_CONFIGS[DEFAULT_VERSION];

    // Import SDK and instantiate ElytroWallet
    const { ElytroWallet } = await import('@elytro/sdk');

    this.sdk = new ElytroWallet(
      chainConfig.endpoint,
      chainConfig.bundler,
      this.contractConfig.factory,
      this.contractConfig.fallback,
      this.contractConfig.recovery,
      {
        chainId: chainConfig.id,
        entryPoint: this.contractConfig.entryPoint,
        elytroWalletLogic: this.contractConfig.elytroWalletLogic,
      }
    );
  }

  /**
   * Calculate the counterfactual smart account address via CREATE2.
   *
   * The contract doesn't exist on-chain yet, but this address is
   * deterministic — guaranteed to be where it will deploy.
   */
  async calcWalletAddress(
    eoaAddress: Address,
    chainId: number,
    index: number = 0,
    initialGuardianHash: Hex = DEFAULT_GUARDIAN_HASH,
    initialGuardianSafePeriod: number = DEFAULT_GUARDIAN_SAFE_PERIOD
  ): Promise<Address> {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Call initForChain() first.');
    }

    // Extension pads the EOA address to 32 bytes as initialKey
    const paddedKey = padHex(eoaAddress, { size: 32 });

    const result = await this.sdk.calcWalletAddress(
      index,
      [paddedKey],
      initialGuardianHash,
      initialGuardianSafePeriod,
      chainId
    );

    if (result.isErr()) {
      throw new Error(`Failed to calculate wallet address: ${result.ERR}`);
    }

    return result.OK as Address;
  }

  get isInitialized(): boolean {
    return this.sdk !== null;
  }

  get contracts(): SDKContractConfig {
    return this.contractConfig;
  }

  /** Expose the raw SDK instance for advanced operations in Phase 2. */
  get raw(): ElytroWallet {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Call initForChain() first.');
    }
    return this.sdk;
  }
}
