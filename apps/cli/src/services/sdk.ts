import type { Address, Hex } from 'viem';
import {
  padHex,
  createPublicClient,
  http,
  toHex,
  parseEther,
  stringToHex,
  keccak256,
  hashTypedData,
  encodeFunctionData,
  encodeAbiParameters,
  decodeAbiParameters,
  parseAbiParameters,
  parseAbiItem,
  zeroHash,
} from 'viem';
import type { ChainConfig, ElytroUserOperation, RecoveryInfo, TRecoveryContactsInfo } from '../types';
import { RecoveryStatusEn } from '../types';
import { ElytroWallet, Bundler, SocialRecovery, type UserOperation, type GuardianSignature } from '@elytro/sdk';
import { ABI_SocialRecoveryModule, ABI_ElytroInfoRecorder, ABI_Elytro } from '@elytro/abi';

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
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
  },
  'v0.8': {
    entryPoint: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
    factory: '0x82a8B1a5986f565a1546672e8939daA1b20F441E',
    fallback: '0xB73Ec2FD0189202F6C22067Eeb19EAad25CAB551',
    recovery: '0xAFEF5D8Fb7B4650B1724a23e40633f720813c731',
    validator: '0xea50a2874df3eEC9E0365425ba948989cd63FED6',
    elytroWalletLogic: '0x2CC8A41e26dAC15F1D11F333f74D0451be6caE36',
    infoRecorder: '0xB21689a23048D39c72EFE96c320F46151f18b22F',
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
  infoRecorder: string;
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
   * Pack a raw ECDSA signature with hook input data.
   *
   * Used when SecurityHook is installed: the hook signature from the backend
   * must be included alongside the EOA signature.
   *
   * Extension reference: sdk.ts#signUserOperationWithHook (line 239-318)
   *
   * @param rawSignature  Raw ECDSA signature from device key
   * @param validationData  Validation data from packRawHash
   * @param hookAddress  SecurityHook contract address
   * @param hookSignature  Hook signature from authorizeUserOperation backend
   */
  async packUserOpSignatureWithHook(
    rawSignature: Hex,
    validationData: Hex,
    hookAddress: Address,
    hookSignature: Hex
  ): Promise<Hex> {
    const sdk = this.ensureSDK();

    const hookInputData = [
      {
        hookAddress,
        inputData: hookSignature,
      },
    ];

    const result = await sdk.packUserOpEOASignature(
      this.contractConfig.validator,
      rawSignature,
      validationData,
      hookInputData
    );

    if (result.isErr()) {
      throw new Error(`Failed to pack signature with hook: ${result.ERR}`);
    }

    return result.OK as Hex;
  }

  /**
   * Pack a raw hash with validation time bounds.
   *
   * Used for EIP-1271 auth signing flow — takes an arbitrary message hash
   * (not a userOp hash) and returns packedHash + validationData.
   */
  async packRawHash(hash: Hex): Promise<{ packedHash: Hex; validationData: Hex }> {
    const sdk = this.ensureSDK();
    const result = await sdk.packRawHash(hash);
    if (result.isErr()) {
      throw new Error(`Failed to pack raw hash: ${result.ERR}`);
    }
    return {
      packedHash: result.OK.packedHash as Hex,
      validationData: result.OK.validationData as Hex,
    };
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

  // ─── Phase 3: Social Recovery ────────────────────────────────────

  /** Guardian info recording category key. */
  private get guardianInfoKey(): Hex {
    return keccak256(stringToHex('GUARDIAN_INFO')) as Hex;
  }

  /** Expose recovery module address. */
  get recoveryModuleAddress(): Address {
    return this.contractConfig.recovery as Address;
  }

  /** Expose info recorder address. */
  get infoRecorderAddress(): Address {
    return this.contractConfig.infoRecorder as Address;
  }

  /**
   * Calculate guardian hash from contacts + threshold.
   * Uses the SDK's SocialRecovery.calcGuardianHash with zero salt.
   */
  calculateRecoveryContactsHash(contacts: string[], threshold: number): string {
    return SocialRecovery.calcGuardianHash(contacts, threshold, zeroHash);
  }

  /**
   * Query recovery info from on-chain SocialRecoveryModule.
   * Returns the guardian hash, nonce, and delay period.
   */
  async getRecoveryInfo(address: Address): Promise<RecoveryInfo | null> {
    const client = this.getPublicClient();

    try {
      const result = (await client.readContract({
        address: this.contractConfig.recovery as Address,
        abi: ABI_SocialRecoveryModule,
        functionName: 'getSocialRecoveryInfo',
        args: [address],
      })) as [string, bigint, bigint];

      return {
        contactsHash: result[0],
        nonce: result[1],
        delayPeriod: result[2],
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the current recovery nonce for a wallet.
   */
  async getRecoveryNonce(address: Address): Promise<number> {
    const client = this.getPublicClient();

    const result = (await client.readContract({
      address: this.contractConfig.recovery as Address,
      abi: ABI_SocialRecoveryModule,
      functionName: 'walletNonce',
      args: [address],
    })) as bigint;

    return Number(result);
  }

  /**
   * Query recovery contacts from on-chain ElytroInfoRecorder (public mode only).
   * Returns null if no guardian info is recorded.
   */
  async queryRecoveryContacts(address: Address): Promise<TRecoveryContactsInfo | null> {
    const client = this.getPublicClient();
    const infoRecorder = this.contractConfig.infoRecorder as Address;
    const guardianKey = keccak256(stringToHex('GUARDIAN_INFO'));

    try {
      // Get latest record block
      const latestBlock = (await client.readContract({
        address: infoRecorder,
        abi: ABI_ElytroInfoRecorder,
        functionName: 'latestRecordAt',
        args: [address, guardianKey],
      })) as bigint;

      if (latestBlock === 0n) {
        return null;
      }

      // Query DataRecorded events in a narrow window around the latest block
      const fromBlock = latestBlock > 10n ? latestBlock - 10n : 0n;

      const logs = await client.getLogs({
        address: infoRecorder,
        event: parseAbiItem('event DataRecorded(address indexed wallet, bytes32 indexed category, bytes data)'),
        args: {
          wallet: address,
          category: guardianKey,
        },
        fromBlock,
        toBlock: latestBlock + 10n,
      });

      if (logs.length === 0) {
        return null;
      }

      // Decode the latest log entry: (address[] contacts, uint256 threshold, bytes32 salt)
      const latestLog = logs[logs.length - 1];
      const [contacts, threshold, salt] = decodeAbiParameters(
        parseAbiParameters(['address[]', 'uint256', 'bytes32']),
        latestLog.data as Hex
      );

      return {
        contacts: contacts as string[],
        threshold: Number(threshold),
        salt: salt as string,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate the EIP-712 approval hash for recovery.
   * Guardians sign this hash to authorize the recovery.
   */
  async generateRecoveryApproveHash(walletAddress: Address, nonce: number, newOwners: string[]): Promise<string> {
    const chainConfig = this.ensureChainConfig();
    const typedData = SocialRecovery.getSocialRecoveryTypedData(
      chainConfig.id,
      this.contractConfig.recovery,
      walletAddress,
      nonce,
      newOwners
    );

    const domain = {
      chainId: Number(typedData.domain.chainId),
      ...(typedData.domain.name && { name: typedData.domain.name }),
      verifyingContract: typedData.domain.verifyingContract as Address,
      ...(typedData.domain.version && { version: typedData.domain.version }),
    };

    const hash = hashTypedData({
      domain,
      types: typedData.types as Record<string, Array<{ name: string; type: string }>>,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });

    return hash.toLowerCase();
  }

  /**
   * Compute the on-chain recovery ID (deterministic keccak256).
   * Used to query operation state.
   */
  async getRecoveryOnchainID(walletAddress: Address, nonce: number, newOwners: string[]): Promise<string> {
    const chainConfig = this.ensureChainConfig();

    // Encode new owners as bytes32 array
    const ownersData = encodeAbiParameters(parseAbiParameters(['bytes32[]']), [
      newOwners.map((owner) => padHex(owner as Hex, { size: 32 })),
    ]);

    // Hash the packed recovery parameters
    const id = keccak256(
      encodeAbiParameters(parseAbiParameters(['address', 'uint256', 'bytes', 'address', 'uint256']), [
        walletAddress,
        BigInt(nonce),
        ownersData,
        this.contractConfig.recovery as Address,
        BigInt(chainConfig.id),
      ])
    );

    return id;
  }

  /**
   * Check if a guardian has signed the approval hash on-chain.
   * Scans ApproveHash events from the recovery module.
   */
  async checkIsGuardianSigned(guardianAddress: Address, fromBlock: bigint, approvalHash?: string): Promise<boolean> {
    const client = this.getPublicClient();

    try {
      const logs = await client.getLogs({
        address: this.contractConfig.recovery as Address,
        event: parseAbiItem('event ApproveHash(address indexed guardian, bytes32 indexed hash)'),
        args: { guardian: guardianAddress },
        fromBlock,
      });

      if (approvalHash) {
        return logs.some((log) => (log.args as Record<string, unknown>)?.hash === approvalHash);
      }

      return logs.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check on-chain recovery operation state.
   */
  async checkOnchainRecoveryStatus(walletAddress: Address, recoveryID: string): Promise<RecoveryStatusEn> {
    const client = this.getPublicClient();

    const status = (await client.readContract({
      address: this.contractConfig.recovery as Address,
      abi: ABI_SocialRecoveryModule,
      functionName: 'getOperationState',
      args: [walletAddress, recoveryID],
    })) as number;

    return Number(status) as RecoveryStatusEn;
  }

  /**
   * Generate transaction to record guardian info on-chain (public mode).
   * Records contacts, threshold, and salt in ElytroInfoRecorder.
   */
  generateRecoveryInfoRecordTx(contacts: string[], threshold: number): { to: string; data: string; value: string } {
    const guardianKey = keccak256(stringToHex('GUARDIAN_INFO'));

    // Encode guardian data: (address[] contacts, uint256 threshold, bytes32 salt)
    const guardianData = encodeAbiParameters(parseAbiParameters(['address[]', 'uint256', 'bytes32']), [
      contacts as Address[],
      BigInt(threshold),
      zeroHash,
    ]);

    const callData = encodeFunctionData({
      abi: ABI_ElytroInfoRecorder,
      functionName: 'recordData',
      args: [guardianKey, guardianData],
    });

    return {
      to: this.contractConfig.infoRecorder,
      data: callData,
      value: '0',
    };
  }

  /**
   * Generate transaction to set guardian hash on SocialRecoveryModule.
   */
  generateRecoveryContactsSettingTx(newHash: string): { to: string; data: string; value: string } {
    const callData = encodeFunctionData({
      abi: ABI_SocialRecoveryModule,
      functionName: 'setGuardian',
      args: [newHash],
    });

    return {
      to: this.contractConfig.recovery,
      data: callData,
      value: '0',
    };
  }

  /**
   * Pack guardian signatures for submitting recovery on-chain.
   */
  packGuardianSignatures(signatures: GuardianSignature[]): string {
    return SocialRecovery.packGuardianSignature(signatures);
  }

  /**
   * Check if an EOA is the owner of a smart account on-chain.
   * Calls `isOwner(bytes32)` on the wallet contract.
   */
  async isOwnerOf(walletAddress: Address, eoaAddress: Address): Promise<boolean> {
    const client = this.getPublicClient();
    const ownerKey = padHex(eoaAddress, { size: 32 });
    const result = await client.readContract({
      address: walletAddress,
      abi: ABI_Elytro,
      functionName: 'isOwner',
      args: [ownerKey],
    });
    return result as boolean;
  }

  /**
   * Get a viem PublicClient for on-chain reads.
   */
  private getPublicClient() {
    const chainConfig = this.ensureChainConfig();
    return createPublicClient({
      transport: http(chainConfig.endpoint),
    });
  }

  private ensureChainConfig(): ChainConfig {
    if (!this.chainConfig) {
      throw new Error('Chain config not set. Call initForChain() first.');
    }
    return this.chainConfig;
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
