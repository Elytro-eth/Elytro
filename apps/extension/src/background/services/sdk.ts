import { SUPPORTED_CHAIN_IDS, TChainItem } from '@/constants/chains';
import {
  getDomainSeparator,
  getEncoded1271MessageHash,
  getEncodedSHA,
  DEFAULT_GUARDIAN_HASH,
  DEFAULT_GUARDIAN_SAFE_PERIOD,
  GUARDIAN_INFO_KEY,
} from '@/constants/sdk-config';
import { formatHex, paddingZero } from '@/utils/format';
import {
  Bundler,
  SignkeyType,
  SocialRecovery,
  SoulWallet,
  Transaction,
} from '@soulwallet/sdk';
import { DecodeUserOp } from '@soulwallet/decoder';
import { canUserOpGetSponsor } from '@/utils/ethRpc/sponsor';
import keyring from './keyring';
import { simulateSendUserOp } from '@/utils/ethRpc/simulate';
import {
  Address,
  createPublicClient,
  Hex,
  http,
  parseEther,
  PublicClient,
  toHex,
  hashMessage,
  serializeSignature,
  zeroHash,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  decodeAbiParameters,
  parseAbiItem,
  parseAbi,
} from 'viem';
import { createAccount } from '@/utils/ethRpc/create-account';
import { ethErrors } from 'eth-rpc-errors';
import { ABI_SoulWallet, ABI_SocialRecoveryModule } from '@soulwallet/abi';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';
import { ABI_RECOVERY_INFO_RECORDER } from '@/constants/abi';

export class SDKService {
  private readonly _REQUIRED_CHAIN_FIELDS: (keyof TChainItem)[] = [
    'id',
    'endpoint',
    'factory',
    'fallback',
    'recovery',
    'onchainConfig',
    'bundler',
  ];

  private _sdk!: SoulWallet;
  private _bundler!: Bundler;
  private _config!: TChainItem;
  private _pimlicoRpc: Nullable<PublicClient> = null;
  private _client: Nullable<PublicClient> = null;

  private _getClient() {
    if (!this._client?.chain?.id || this._client.chain.id !== this._config.id) {
      this._client = createPublicClient({
        transport: http(this._config.endpoint),
        chain: this._config,
      });
    }
    return this._client!;
  }

  constructor() {
    eventBus.on(EVENT_TYPES.CHAIN.CHAIN_INITIALIZED, (chain: TChainItem) => {
      this.resetSDK(chain);
    });
  }

  get bundler() {
    return this._bundler;
  }

  public resetSDK(chainConfig: TChainItem) {
    if (!SUPPORTED_CHAIN_IDS.includes(chainConfig.id)) {
      throw new Error(
        `Elytro: chain ${chainConfig.id} is not supported for now.`
      );
    }

    if (this._isConfigUnchanged(chainConfig)) {
      console.log('Elytro::SDK: chain config unchanged, no reset needed.');
      return;
    }

    this.initializeSDK(chainConfig);
  }

  private _isConfigUnchanged(newConfig: TChainItem): boolean {
    if (!this._config) return false;

    return this._REQUIRED_CHAIN_FIELDS.every(
      (field) => newConfig[field] === this._config?.[field]
    );
  }

  private initializeSDK(config: TChainItem) {
    const { endpoint, bundler, factory, fallback, recovery, onchainConfig } =
      config;

    this._sdk = new SoulWallet(
      endpoint,
      bundler,
      factory,
      fallback,
      recovery,
      onchainConfig
    );

    this._bundler = new Bundler(bundler);
    this._config = config;
  }

  // TODO: temp, make sure it's unique later.
  // random index, just make sure it's unique. Save to local if user need to export the wallet.
  // also, make sure it keeps the same when it's a same SA address.
  private get _index() {
    return 0; // Math.floor(Math.random() * 100);
  }

  /**
   * Create a smart account wallet address
   * @param eoaAddress - The address of the EOA that will be the owner of the wallet.
   * @param initialGuardianHash - The hash of the initial guardian.
   * @param initialGuardianSafePeriod - The safe period for the initial guardian.
   * @param chainId - The chain id.
   * @returns The address of the wallet.
   */
  public async createWalletAddress(
    eoaAddress: string,
    chainId: number,
    initialGuardianHash: string = DEFAULT_GUARDIAN_HASH,
    initialGuardianSafePeriod: number = DEFAULT_GUARDIAN_SAFE_PERIOD
  ) {
    const initialKeysStrArr = [paddingZero(eoaAddress, 32)];

    const res = await this._sdk?.calcWalletAddress(
      this._index,
      initialKeysStrArr,
      initialGuardianHash,
      initialGuardianSafePeriod,
      chainId
    );

    if (res.isErr()) {
      throw res.ERR;
    } else {
      // no need await for createAccount request. it's not a blocking request.
      createAccount(
        res.OK,
        chainId,
        this._index,
        initialKeysStrArr,
        initialGuardianHash,
        initialGuardianSafePeriod
      );
      return res.OK as Address;
    }
  }

  /**
   * Create an unsigned user operation for deploying a smart account wallet
   * @param eoaAddress - The address of the EOA that will be the owner of the wallet.
   * @param initialGuardianHash - The hash of the initial guardian.
   * @param initialGuardianSafePeriod - The safe period for the initial guardian.
   * @returns The unsigned user operation.
   */
  public async createUnsignedDeployWalletUserOp(
    eoaAddress: string,
    initialGuardianHash: string = DEFAULT_GUARDIAN_HASH,
    initialGuardianSafePeriod: number = DEFAULT_GUARDIAN_SAFE_PERIOD
  ) {
    const emptyCallData = '0x';
    const res = await this._sdk?.createUnsignedDeployWalletUserOp(
      this._index,
      [paddingZero(eoaAddress, 32)],
      initialGuardianHash,
      emptyCallData,
      initialGuardianSafePeriod
    );

    if (res.isErr()) {
      throw res.ERR;
    } else {
      return res.OK;
    }
  }

  public async canGetSponsored(userOp: ElytroUserOperation) {
    const { chainId, entryPoint } = this._config.onchainConfig;
    return await canUserOpGetSponsor(userOp, chainId, entryPoint);
  }

  public async isSmartAccountDeployed(address: string) {
    const code = await this._sdk.provider.getCode(address);
    // when account is not deployed, it's code is undefined or 0x.
    return code !== undefined && code !== '0x';
  }

  public async sendUserOperation(
    userOp: ElytroUserOperation,
    opHash: string
  ): Promise<{ txHash?: string; opHash: string }> {
    const res = await this._sdk.sendUserOperation(userOp);
    if (res.isErr()) {
      throw res.ERR;
    }

    return await this.getUserOperationResult(userOp, opHash);
  }

  public async sendUserOperationOnly(
    userOp: ElytroUserOperation
  ): Promise<boolean> {
    const res = await this._sdk.sendUserOperation(userOp);
    if (res.isErr()) {
      throw res.ERR;
    }
    return true;
  }

  public async getUserOperationResult(
    userOp: ElytroUserOperation,
    opHash: string
  ) {
    const client = this._getClient();

    return Promise.race([
      new Promise<{ txHash?: string; opHash: string }>((resolve) => {
        const unwatch = client.watchEvent({
          address: this._config.onchainConfig.entryPoint as Address,
          event: parseAbiItem(
            'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
          ),
          args: {
            userOpHash: opHash as Hex,
            sender: userOp.sender,
          },
          onLogs: (logs) => {
            const targetLog = logs.find(
              (log) => log.args?.userOpHash === opHash
            );
            if (targetLog) {
              unwatch?.();
              resolve({ txHash: targetLog.transactionHash, opHash });
            }
          },
          onError: () => {
            unwatch?.();
            resolve({ opHash });
          },
        });
      }),
      new Promise<{ opHash: string }>(
        (resolve) => setTimeout(() => resolve({ opHash }), 20_000) // 20s timeout. tune it later if needed.
      ),
    ]);
  }

  public async signUserOperation(userOp: ElytroUserOperation) {
    const opHash = await this._sdk.userOpHash(userOp);

    if (opHash.isErr()) {
      throw opHash.ERR;
    } else {
      const signature = await this._getSignature({
        messageHash: opHash.OK,
        validStartTime: 0, // 0
        validEndTime: Math.floor(new Date().getTime() / 1000) + 60 * 5, // 5 mins
      });
      userOp.signature = signature;
      return { signature, opHash: opHash.OK };
    }
  }

  public async getUserOperationReceipt(userOpHash: string) {
    try {
      const res = await this._bundler?.eth_getUserOperationReceipt(userOpHash);

      if (res?.isErr()) {
        throw res.ERR;
      } else if (res?.OK) {
        return { ...res.OK.receipt, success: res.OK.success };
      }
    } catch (error) {
      console.error('Elytro: Failed to get user operation receipt.', error);
      return null;
    }
  }

  // private async _getPackedUserOpHash(userOp: ElytroUserOperation) {
  //   const opHash = await this._sdk.userOpHash(userOp);

  //   if (opHash.isErr()) {
  //     throw opHash.ERR;
  //   } else {
  //     const packedHash = await this._sdk.packRawHash(
  //       opHash.OK,
  //       0, // start time
  //       Math.floor(new Date().getTime() / 1000) + 60 * 5 // end time
  //     );

  //     if (packedHash.isErr()) {
  //       throw packedHash.ERR;
  //     } else {
  //       return { ...packedHash.OK, userOpHash: opHash.OK };
  //     }
  //   }
  // }

  private async _isSignatureValid(
    address: Hex,
    messageHash: Hex,
    signature: Hex
  ) {
    const _client = this._getClient();

    const magicValue = await _client.readContract({
      address,
      abi: ABI_SoulWallet,
      functionName: 'isValidSignature',
      args: [messageHash, signature],
    });

    if (magicValue !== '0x1626ba7e') {
      throw new Error('Elytro: Invalid signature.');
    }
  }

  /**
   * Raw sign message. For EIP-1271 signature.
   * @param message - The message to sign.
   * @returns The signature.
   */
  private async _rawSign(message: Hex) {
    const _eoaSignature = keyring.signingKey?.signDigest(message);

    if (!_eoaSignature) {
      throw new Error('Elytro: Failed to sign message.');
    }

    const _eoaSignatureHex = serializeSignature({
      r: _eoaSignature.r as Hex,
      s: _eoaSignature.s as Hex,
      v: BigInt(_eoaSignature.v),
    });

    return _eoaSignatureHex;
  }

  /**
   * Personal sign message. For internal user operation signature.
   * @param message - The message to sign.
   * @returns The signature.
   */
  private async _personalSign(message: Hex) {
    const _eoaSignature = keyring.owner?.signMessage({
      message: { raw: message },
    });

    if (!_eoaSignature) {
      throw new Error('Elytro: Failed to sign message.');
    }

    return _eoaSignature;
  }

  private async _getSignature(
    packParams: {
      messageHash: string;
      validStartTime?: number;
      validEndTime?: number;
    },
    useRawSign = false
  ) {
    const rawHashRes = await this._sdk.packRawHash(
      packParams.messageHash,
      packParams.validStartTime,
      packParams.validEndTime
    );

    if (rawHashRes.isErr()) {
      throw rawHashRes.ERR;
    }

    // TODO： move sign userOp to wallet controller, so the keyring will be same instance
    await keyring.tryUnlock();

    const signature = useRawSign
      ? await this._rawSign(rawHashRes.OK.packedHash as Hex)
      : await this._personalSign(rawHashRes.OK.packedHash as Hex);

    const signRes = await this._sdk.packUserOpEOASignature(
      this._config.validator,
      signature,
      rawHashRes.OK.validationData
    );

    if (signRes.isErr()) {
      throw signRes.ERR;
    } else {
      return signRes.OK; // signature
    }
  }

  public async getDecodedUserOperation(userOp: ElytroUserOperation) {
    if (userOp.callData?.length <= 2) {
      return null;
    }

    const res = await DecodeUserOp(
      this._config.id,
      this._config.onchainConfig.entryPoint,
      userOp
    );

    if (res.isErr()) {
      throw res.ERR;
    } else {
      return res.OK;
    }
  }

  public async simulateUserOperation(userOp: ElytroUserOperation) {
    return await simulateSendUserOp(
      userOp,
      this._config.onchainConfig.entryPoint,
      this._config.id
    );
  }

  private async _getFeeDataFromSDKProvider() {
    try {
      const fee = await this._sdk.provider.getFeeData();
      return fee;
    } catch {
      throw ethErrors.rpc.server({
        code: 32011,
        message: 'Elytro:Failed to get fee data.',
      });
    }
  }

  private async _getPimlicoFeeData() {
    const newRpcUrl = this._config.bundler;
    if (!this._pimlicoRpc || this._pimlicoRpc.transport.url !== newRpcUrl) {
      this._pimlicoRpc = createPublicClient({
        transport: http(newRpcUrl),
      });
    }

    const ret = await this._pimlicoRpc.request({
      method: 'pimlico_getUserOperationGasPrice' as SafeAny,
      params: [] as SafeAny,
    });
    return (ret as SafeAny)?.standard;
  }

  private async _getFeeData() {
    let gasPrice;
    if (this._config.bundler.includes('pimlico')) {
      // pimlico uses different gas price
      gasPrice = await this._getPimlicoFeeData();
    } else {
      gasPrice = await this._getFeeDataFromSDKProvider();
    }
    return gasPrice;
  }

  public async estimateGas(
    userOp: ElytroUserOperation,
    useDefaultGasPrice = true
  ) {
    // looks like only deploy wallet will need this
    if (useDefaultGasPrice) {
      const gasPrice = await this._getFeeData();

      // todo: what if it's null? set as 0?
      userOp.maxFeePerGas = gasPrice?.maxFeePerGas ?? 0;
      userOp.maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas ?? 0;
    }

    // todo: sdk can be optimized (fetch balance in sdk)

    const res = await this._sdk.estimateUserOperationGas(
      this._config.validator,
      userOp,
      {
        [userOp.sender]: {
          balance: toHex(parseEther('1')),
          // getHexString(
          //   await this._sdk.provider.getBalance(userOp.sender)
          // ),
        },
      },
      SignkeyType.EOA // 目前仅支持EOA
    );

    if (res.isErr()) {
      throw res.ERR;
    } else {
      const {
        callGasLimit,
        preVerificationGas,
        verificationGasLimit,
        paymasterPostOpGasLimit,
        paymasterVerificationGasLimit,
      } = res.OK;

      userOp.callGasLimit = BigInt(callGasLimit);
      userOp.preVerificationGas = BigInt(preVerificationGas);
      userOp.verificationGasLimit = BigInt(verificationGasLimit);

      if (
        userOp.paymaster !== null &&
        typeof paymasterPostOpGasLimit !== 'undefined' &&
        typeof paymasterVerificationGasLimit !== 'undefined'
      ) {
        userOp.paymasterPostOpGasLimit = BigInt(paymasterPostOpGasLimit);
        userOp.paymasterVerificationGasLimit = BigInt(
          paymasterVerificationGasLimit
        );
      }

      return userOp;
    }
  }

  public async getRechargeAmountForUserOp(
    userOp: ElytroUserOperation,
    transferValue: bigint
  ) {
    const hasSponsored = await this.canGetSponsored(userOp);

    if (!hasSponsored) {
      await this.estimateGas(userOp);
    }

    const res = await this._sdk.preFund(userOp);

    if (res.isErr()) {
      throw res.ERR;
    } else {
      const {
        missfund,
        prefund,
        //deposit, prefund
      } = res.OK;
      const balance = await this._sdk.provider.getBalance(userOp.sender);
      const missAmount = hasSponsored
        ? transferValue - balance // why transferValue is not accurate? missfund is wrong during preFund?
        : BigInt(missfund) + transferValue - balance;

      return {
        userOp,
        calcResult: {
          balance, // user balance
          gasUsed: prefund,
          hasSponsored, // for this userOp, can get sponsored or not
          missAmount: missAmount > 0n ? missAmount : 0n, // for this userOp, how much it needs to deposit
          needDeposit: missAmount > 0n, // need to deposit or not
          suspiciousOp: missAmount > parseEther('0.001'), // if missAmount is too large, it may considered suspicious
        } as TUserOperationPreFundResult,
      };
    }
  }

  public async signMessage(message: Hex, saAddress: Address) {
    const hashedMessage = hashMessage({ raw: message });
    const encode1271MessageHash = getEncoded1271MessageHash(hashedMessage);
    const domainSeparator = getDomainSeparator(
      toHex(this._config.id),
      saAddress
    );
    const messageHash = getEncodedSHA(domainSeparator, encode1271MessageHash);

    const signature = await this._getSignature({ messageHash }, true);

    await this._isSignatureValid(saAddress, hashedMessage, signature as Hex);

    return signature;
  }

  public async createUserOpFromTxs(from: string, txs: Transaction[]) {
    const gasPrice = await this._getFeeData();
    const _userOp = await this._sdk.fromTransaction(
      formatHex(gasPrice?.maxFeePerGas ?? 0),
      formatHex(gasPrice?.maxPriorityFeePerGas ?? 0),
      from,
      txs as Transaction[]
    );

    if (_userOp.isErr()) {
      throw _userOp.ERR;
    } else {
      return _userOp.OK;
    }
  }

  public calculateRecoveryContactsHash(contacts: string[], threshold: number) {
    return SocialRecovery.calcGuardianHash(contacts, threshold, zeroHash);
  }

  public async getRecoveryInfo(address: Address) {
    const _client = this._getClient();

    try {
      const socialRecoveryInfo = (await _client.readContract({
        address: this._config.recovery as Address,
        abi: ABI_SocialRecoveryModule,
        functionName: 'getSocialRecoveryInfo',
        args: [address],
      })) as SafeAny[];

      if (socialRecoveryInfo?.length !== 3) {
        throw new Error('Elytro: Failed to get recovery info.');
      }

      return {
        contactsHash: socialRecoveryInfo[0] as string,
        nonce: socialRecoveryInfo[1] as bigint,
        delayPeriod: socialRecoveryInfo[2] as bigint,
      };
    } catch (error) {
      console.error('Elytro: Failed to get recovery info.', error);
      return null;
    }
  }

  public async generateRecoveryInfoRecordTx(
    guardians: string[],
    threshold: number
  ) {
    if (!this._config.infoRecorder) {
      throw new Error(
        `Elytro: Info recorder on chain ${this._config.name} is not set.`
      );
    }

    // Encode the guardian data
    // Encode the guardian data
    const guardianData = encodeAbiParameters(
      parseAbiParameters(['address[]', 'uint256', 'bytes32']),
      [guardians as Address[], BigInt(threshold), zeroHash]
    );

    // Encode the function call data using viem
    const callData = encodeFunctionData({
      abi: ABI_RECOVERY_INFO_RECORDER,
      functionName: 'recordData',
      args: [GUARDIAN_INFO_KEY, guardianData],
    });

    return {
      to: this._config.infoRecorder,
      data: callData,
      gasLimit: undefined,
      value: '0',
    };
  }

  public async generateRecoveryContactsSettingTxInfo(newHash: string) {
    const calldata = encodeFunctionData({
      abi: ABI_SocialRecoveryModule,
      functionName: 'setGuardian',
      args: [newHash],
    });

    return {
      to: this._config.recovery as Address,
      data: calldata,
      gasLimit: undefined,
      value: '0',
    };
  }

  private async _getInfoRecorderStartBlock(address: Address) {
    const _client = this._getClient();

    const latestRecordAt = await _client.readContract({
      address: this._config.infoRecorder as Address,
      abi: parseAbi([
        'function latestRecordAt(address addr, bytes32 category) external view returns (uint256 blockNumber)',
      ]),
      functionName: 'latestRecordAt',
      args: [address, GUARDIAN_INFO_KEY],
    });

    return latestRecordAt;
  }

  public async queryRecoveryContacts(address: Address) {
    if (!this._config.infoRecorder) {
      throw new Error(
        `Elytro: Info recorder on chain ${this._config.name} is not set.`
      );
    }

    const startBlock = await this._getInfoRecorderStartBlock(address);

    if (startBlock === 0n) {
      return null;
    }

    const _client = this._getClient();
    const fromBlock = startBlock - 10n > 0n ? startBlock - 10n : 0n;

    const logs = await _client.getLogs({
      address: this._config.infoRecorder as Address,
      toBlock: startBlock,
      fromBlock,
      event: parseAbiItem(
        'event DataRecorded(address indexed wallet, bytes32 indexed category, bytes data)'
      ),
      args: {
        wallet: address,
        category: GUARDIAN_INFO_KEY,
      },
    });

    // Decode the events
    const parseContactFromLog = (log: (typeof logs)[number]) => {
      if (!log || !log.args) {
        return null;
      }
      const parsedLog = decodeAbiParameters(
        parseAbiParameters(['address[]', 'uint256', 'bytes32']),
        (log.args as SafeAny).data
      );
      return {
        guardians: parsedLog[0],
        threshold: Number(parsedLog[1]),
        salt: parsedLog[2],
      } as TGuardianInfo;
    };

    const latestRecoveryContacts = parseContactFromLog(logs[logs.length - 1]);

    return latestRecoveryContacts;
  }

  // public async getPreFund(
  //   userOp: ElytroUserOperation,
  //   transferValue: bigint,
  //   isValidForSponsor: boolean
  // ) {
  //   const res = await this._sdk.preFund(userOp);

  //   if (res.isErr()) {
  //     throw res.ERR;
  //   } else {
  //     const preFund = res.OK;
  //     const _balance = await this._sdk.provider.getBalance(userOp.sender);
  //     const missFund = BigInt(preFund.missfund);

  //     if (!isValidForSponsor || transferValue > 0) {
  //       const maxMissFoundEth = '0.001';
  //       const maxMissFund = parseEther(maxMissFoundEth);

  //       const fundRequest = isValidForSponsor
  //         ? transferValue
  //         : transferValue + missFund;

  //       if (fundRequest > maxMissFund) {
  //         throw new Error(
  //           'Elytro: We may encounter fund issues. Please try again.'
  //         );
  //       }

  //       if (fundRequest > _balance) {
  //         throw new Error('Elytro: Insufficient balance.');
  //       }
  //     }
  //   }
  // }

  // private _isReceiptValid(receipt: unknown): boolean {
  //   return (
  //     receipt &&
  //     receipt !== UserOperationStatusEn.pending &&
  //     receipt.transactionHash
  //   );
  // }
}

export const elytroSDK = new SDKService();
