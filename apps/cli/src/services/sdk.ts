import type { Address, Hex } from 'viem';
import { padHex, createPublicClient, http, toHex, parseEther } from 'viem';
import type { ChainConfig, ElytroUserOperation } from '../types';
import { ElytroWallet, Bundler, type UserOperation } from '@elytro/sdk';

/**
 * SDKService — @elytro/sdk wrapper for ERC-4337 operations.
 *
 * Phase 1: address calculation for account creation.
 * Phase 2: full UserOp lifecycle (sign, send, estimate, receipt).
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

/**
 * Default dummy signature for gas estimation.
 * Extension uses this same value when no hooks are present.
 */
const DUMMY_SIGNATURE =
  '0xea50a2874df3eEC9E0365425ba948989cd63FED6000000620100005f5e0fff000fffffffff0000000000000000000000000000000000000000b91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c' as Hex;

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
  private bundlerInstance: Bundler | null = null;
  private chainConfig: ChainConfig | null = null;
  private contractConfig: SDKContractConfig = ENTRYPOINT_CONFIGS[DEFAULT_VERSION];

  async initForChain(chainConfig: ChainConfig, entrypointVersion: string = DEFAULT_VERSION): Promise<void> {
    this.chainConfig = chainConfig;
    this.contractConfig = ENTRYPOINT_CONFIGS[entrypointVersion] ?? ENTRYPOINT_CONFIGS[DEFAULT_VERSION];

    // Import SDK and instantiate ElytroWallet
    const { ElytroWallet, Bundler } = await import('@elytro/sdk');

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

    this.bundlerInstance = new Bundler(chainConfig.bundler);
  }

  // ─── Phase 1: Address Calculation ──────────────────────────────

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
    const sdk = this.ensureSDK();

    // Extension pads the EOA address to 32 bytes as initialKey
    const paddedKey = padHex(eoaAddress, { size: 32 });

    const result = await sdk.calcWalletAddress(
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

  // ─── Phase 2: UserOp Lifecycle ─────────────────────────────────

  /**
   * Create an unsigned UserOperation from transactions.
   *
   * Wraps the SDK's `fromTransaction()` which handles:
   * - Nonce fetching from the on-chain wallet
   * - callData encoding (single execute / batch executeBatch)
   * - Setting factory/factoryData to null (non-deploy op)
   *
   * Extension reference: sdk.ts#createUserOpFromTxs (line 1115-1122).
   *
   * @param senderAddress  Deployed smart account address
   * @param txs            Array of { to, value?, data? } in hex string format
   */
  async createSendUserOp(
    senderAddress: Address,
    txs: Array<{ to: string; value?: string; data?: string }>
  ): Promise<ElytroUserOperation> {
    const sdk = this.ensureSDK();

    // Pass placeholder gas prices — caller fills with getFeeData() after
    const result = await sdk.fromTransaction('0x1', '0x1', senderAddress, txs);

    if (result.isErr()) {
      throw new Error(`Failed to build send UserOp: ${result.ERR}`);
    }

    return this.normalizeUserOp(result.OK as Record<string, unknown>);
  }

  /**
   * Create an unsigned deploy UserOperation.
   *
   * Builds a UserOp with factory + factoryData that, when sent to the
   * bundler, deploys the smart wallet contract at the counterfactual address.
   */
  async createDeployUserOp(
    eoaAddress: Address,
    index: number = 0,
    initialGuardianHash: Hex = DEFAULT_GUARDIAN_HASH,
    initialGuardianSafePeriod: number = DEFAULT_GUARDIAN_SAFE_PERIOD
  ): Promise<ElytroUserOperation> {
    const sdk = this.ensureSDK();
    const paddedKey = padHex(eoaAddress, { size: 32 });

    const result = await sdk.createUnsignedDeployWalletUserOp(
      index,
      [paddedKey],
      initialGuardianHash,
      undefined, // callData
      initialGuardianSafePeriod
    );

    if (result.isErr()) {
      throw new Error(`Failed to create deploy UserOp: ${result.ERR}`);
    }

    return this.normalizeUserOp(result.OK);
  }

  /**
   * Get gas price from Pimlico bundler.
   *
   * Uses the non-standard `pimlico_getUserOperationGasPrice` RPC method.
   * Returns { maxFeePerGas, maxPriorityFeePerGas } from the "fast" tier.
   */
  async getFeeData(chainConfig: ChainConfig): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
    const client = createPublicClient({
      transport: http(chainConfig.bundler),
    });

    try {
      const result = await client.request({
        method: 'pimlico_getUserOperationGasPrice' as never,
        params: [] as never,
      });

      const fast = (result as Record<string, Record<string, string>>)?.fast;
      if (!fast) {
        throw new Error('Unexpected response from pimlico_getUserOperationGasPrice');
      }

      return {
        maxFeePerGas: BigInt(fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(fast.maxPriorityFeePerGas),
      };
    } catch {
      // Fallback: use standard eth_gasPrice
      const gasPrice = await createPublicClient({
        transport: http(chainConfig.endpoint),
      }).getGasPrice();

      return {
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / 10n,
      };
    }
  }

  /**
   * Estimate gas limits for a UserOperation via the bundler.
   *
   * Sets a dummy signature for estimation (same as extension).
   * For undeployed accounts, pass `fakeBalance: true` to inject a
   * state override that gives the sender 1 ETH — prevents AA21.
   *
   * Extension reference: sdk.ts#estimateGas (lines 602-650).
   */
  async estimateUserOp(
    userOp: ElytroUserOperation,
    opts: { fakeBalance?: boolean } = {}
  ): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    paymasterVerificationGasLimit: bigint | null;
    paymasterPostOpGasLimit: bigint | null;
  }> {
    const sdk = this.ensureSDK();

    // Set dummy signature for estimation
    const opForEstimate = { ...userOp, signature: DUMMY_SIGNATURE };

    // State override: fake sender balance to prevent AA21 for undeployed/unfunded accounts
    const stateOverride = opts.fakeBalance ? { [userOp.sender]: { balance: toHex(parseEther('1')) } } : undefined;

    const result = await sdk.estimateUserOperationGas(
      this.contractConfig.validator,
      this.toSDKUserOp(opForEstimate),
      stateOverride
    );

    if (result.isErr()) {
      const err = result.ERR;
      throw new Error(
        `Gas estimation failed: ${typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err)}`
      );
    }

    const gas = result.OK;
    return {
      callGasLimit: BigInt(gas.callGasLimit),
      verificationGasLimit: BigInt(gas.verificationGasLimit),
      preVerificationGas: BigInt(gas.preVerificationGas),
      paymasterVerificationGasLimit: gas.paymasterVerificationGasLimit
        ? BigInt(gas.paymasterVerificationGasLimit)
        : null,
      paymasterPostOpGasLimit: gas.paymasterPostOpGasLimit ? BigInt(gas.paymasterPostOpGasLimit) : null,
    };
  }

  /**
   * Compute the ERC-4337 UserOperation hash.
   *
   * Two-step: userOpHash → packRawHash to get the final digest for signing.
   */
  async getUserOpHash(userOp: ElytroUserOperation): Promise<{ packedHash: Hex; validationData: Hex }> {
    const sdk = this.ensureSDK();

    // Step 1: compute raw userOp hash
    const hashResult = await sdk.userOpHash(this.toSDKUserOp(userOp));
    if (hashResult.isErr()) {
      throw new Error(`Failed to compute userOpHash: ${hashResult.ERR}`);
    }

    // Step 2: pack with validation time bounds (0 = no time restriction)
    const packResult = await sdk.packRawHash(hashResult.OK as string);
    if (packResult.isErr()) {
      throw new Error(`Failed to pack raw hash: ${packResult.ERR}`);
    }

    return {
      packedHash: packResult.OK.packedHash as Hex,
      validationData: packResult.OK.validationData as Hex,
    };
  }

  /**
   * Pack a raw ECDSA signature into the format expected by the EntryPoint.
   *
   * Wraps the signature with validator address and validation data.
   */
  async packUserOpSignature(rawSignature: Hex, validationData: Hex): Promise<Hex> {
    const sdk = this.ensureSDK();

    const result = await sdk.packUserOpEOASignature(this.contractConfig.validator, rawSignature, validationData);

    if (result.isErr()) {
      throw new Error(`Failed to pack signature: ${result.ERR}`);
    }

    return result.OK as Hex;
  }

  /**
   * Send a signed UserOperation to the bundler.
   */
  async sendUserOp(userOp: ElytroUserOperation): Promise<Hex> {
    const sdk = this.ensureSDK();

    // The SDK's sendUserOperation returns true on success.
    // The actual opHash must be computed separately.
    const sendResult = await sdk.sendUserOperation(this.toSDKUserOp(userOp));
    if (sendResult.isErr()) {
      const err = sendResult.ERR;
      throw new Error(
        `Failed to send UserOp: ${typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err)}`
      );
    }

    // Compute the opHash for receipt polling
    const hashResult = await sdk.userOpHash(this.toSDKUserOp(userOp));
    if (hashResult.isErr()) {
      throw new Error(`UserOp sent but failed to compute hash for tracking: ${hashResult.ERR}`);
    }

    return hashResult.OK as Hex;
  }

  /**
   * Poll the bundler for a UserOperation receipt.
   *
   * Exponential backoff: 2s → 1.5× → cap 15s, max 30 attempts (~90s).
   */
  async waitForReceipt(opHash: Hex): Promise<{
    success: boolean;
    actualGasCost: string;
    actualGasUsed: string;
    transactionHash: Hex;
    blockNumber: string;
  }> {
    const bundler = this.ensureBundler();

    let delay = 2000;
    const maxDelay = 15000;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(delay);

      const result = await bundler.eth_getUserOperationReceipt(opHash);

      if (result.isErr()) {
        throw new Error(`Failed to poll receipt: ${result.ERR}`);
      }

      const receipt = result.OK;
      if (receipt) {
        return {
          success: receipt.success,
          actualGasCost: String(receipt.actualGasCost),
          actualGasUsed: String(receipt.actualGasUsed),
          transactionHash: (receipt.receipt?.transactionHash ?? opHash) as Hex,
          blockNumber: String(receipt.receipt?.blockNumber ?? '0'),
        };
      }

      // Increase delay with cap
      delay = Math.min(Math.floor(delay * 1.5), maxDelay);
    }

    throw new Error(`UserOperation receipt not found after ${maxAttempts} attempts (~90s). Hash: ${opHash}`);
  }

  // ─── Accessors ─────────────────────────────────────────────────

  get isInitialized(): boolean {
    return this.sdk !== null;
  }

  get contracts(): SDKContractConfig {
    return this.contractConfig;
  }

  get entryPoint(): Address {
    return this.contractConfig.entryPoint as Address;
  }

  get validatorAddress(): Address {
    return this.contractConfig.validator as Address;
  }

  /** Default init params used for wallet creation — needed for backend registration. */
  get initDefaults(): { guardianHash: Hex; guardianSafePeriod: number } {
    return {
      guardianHash: DEFAULT_GUARDIAN_HASH,
      guardianSafePeriod: DEFAULT_GUARDIAN_SAFE_PERIOD,
    };
  }

  /** Expose the raw SDK instance for advanced operations. */
  get raw(): ElytroWallet {
    return this.ensureSDK();
  }

  // ─── Internal ──────────────────────────────────────────────────

  private ensureSDK(): ElytroWallet {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Call initForChain() first.');
    }
    return this.sdk;
  }

  private ensureBundler(): Bundler {
    if (!this.bundlerInstance) {
      throw new Error('Bundler not initialized. Call initForChain() first.');
    }
    return this.bundlerInstance;
  }

  /**
   * Normalize SDK UserOp (which uses string/BigNumberish) to our typed format.
   */
  private normalizeUserOp(sdkOp: Record<string, unknown>): ElytroUserOperation {
    return {
      sender: sdkOp.sender as string as Address,
      nonce: BigInt(sdkOp.nonce as string | number | bigint),
      factory: (sdkOp.factory as string as Address) ?? null,
      factoryData: (sdkOp.factoryData as Hex) ?? null,
      callData: (sdkOp.callData as Hex) ?? '0x',
      callGasLimit: BigInt((sdkOp.callGasLimit as string | number | bigint) || 0),
      verificationGasLimit: BigInt((sdkOp.verificationGasLimit as string | number | bigint) || 0),
      preVerificationGas: BigInt((sdkOp.preVerificationGas as string | number | bigint) || 0),
      maxFeePerGas: BigInt((sdkOp.maxFeePerGas as string | number | bigint) || 0),
      maxPriorityFeePerGas: BigInt((sdkOp.maxPriorityFeePerGas as string | number | bigint) || 0),
      paymaster: (sdkOp.paymaster as string as Address) ?? null,
      paymasterVerificationGasLimit: sdkOp.paymasterVerificationGasLimit
        ? BigInt(sdkOp.paymasterVerificationGasLimit as string | number | bigint)
        : null,
      paymasterPostOpGasLimit: sdkOp.paymasterPostOpGasLimit
        ? BigInt(sdkOp.paymasterPostOpGasLimit as string | number | bigint)
        : null,
      paymasterData: (sdkOp.paymasterData as Hex) ?? null,
      signature: (sdkOp.signature as Hex) ?? '0x',
    };
  }

  /**
   * Convert our typed UserOp back to the SDK's format (string-based BigNumberish).
   */
  private toSDKUserOp(op: ElytroUserOperation): UserOperation {
    return {
      sender: op.sender,
      nonce: toHex(op.nonce),
      factory: op.factory,
      factoryData: op.factoryData,
      callData: op.callData,
      callGasLimit: toHex(op.callGasLimit),
      verificationGasLimit: toHex(op.verificationGasLimit),
      preVerificationGas: toHex(op.preVerificationGas),
      maxFeePerGas: toHex(op.maxFeePerGas),
      maxPriorityFeePerGas: toHex(op.maxPriorityFeePerGas),
      paymaster: op.paymaster,
      paymasterVerificationGasLimit: op.paymasterVerificationGasLimit ? toHex(op.paymasterVerificationGasLimit) : null,
      paymasterPostOpGasLimit: op.paymasterPostOpGasLimit ? toHex(op.paymasterPostOpGasLimit) : null,
      paymasterData: op.paymasterData,
      signature: op.signature,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
