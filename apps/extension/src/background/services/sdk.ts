import { chainIdToChainNameMap, SUPPORTED_CHAIN_MAP } from '@/constants/chains';
import {
  getDomainSeparator,
  getEncoded1271MessageHash,
  getEncodedSHA,
  SDK_INIT_CONFIG_BY_CHAIN_MAP,
  SDKInitConfig,
} from '@/constants/sdk-config';
import {
  DEFAULT_GUARDIAN_HASH,
  DEFAULT_GUARDIAN_SAFE_PERIOD,
  TEMP_ENTRY_POINT,
} from '@/constants/temp';
import { formatHex, getHexString, paddingZero } from '@/utils/format';
import { Bundler, SignkeyType, SoulWallet, Transaction } from '@soulwallet/sdk';
import { DecodeUserOp } from '@soulwallet/decoder';
import { canUserOpGetSponsor } from '@/utils/ethRpc/sponsor';
import keyring from './keyring';
import { simulateSendUserOp } from '@/utils/ethRpc/simulate';
import { UserOperationStatusEn } from '@/constants/operations';
import {
  Address,
  createPublicClient,
  Hex,
  http,
  parseEther,
  PublicClient,
  toHex,
} from 'viem';
import { createAccount } from '@/utils/ethRpc/create-account';
import { ethErrors } from 'eth-rpc-errors';
import { sepolia } from 'viem/chains';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

class ElytroSDK {
  private _sdk!: SoulWallet;
  private _bundler!: Bundler;
  private _chainId!: number;
  private _config!: SDKInitConfig;
  private _pimlicoRpc: Nullable<PublicClient> = null;

  constructor() {
    this._initByChainId(sepolia.id);
    this._chainChangeWatcher();
  }

  get bundler() {
    return this._bundler;
  }

  private _chainChangeWatcher() {
    eventBus.on(EVENT_TYPES.NETWORK.ITEMS_UPDATED, (currentChain) => {
      this.resetSDK(currentChain.id);
    });
  }

  public resetSDK(chainId: number) {
    if (chainId !== this._chainId) {
      this._initByChainId(chainId);
    }
  }

  // TODO: temp, make sure it's unique later.
  // random index, just make sure it's unique. Save to local if user need to export the wallet.
  // also, make sure it keeps the same when it's a same SA address.
  private get _index() {
    return 0; // Math.floor(Math.random() * 100);
  }

  get chain() {
    return SUPPORTED_CHAIN_MAP[chainIdToChainNameMap[this._chainId]];
  }

  private _initByChainId(chainId: number) {
    this._config = SDK_INIT_CONFIG_BY_CHAIN_MAP[chainId];
    const { endpoint, bundler, factory, fallback, recovery } = this._config;
    this._sdk = new SoulWallet(endpoint, bundler, factory, fallback, recovery);
    this._bundler = new Bundler(bundler);
    this._chainId = chainId;
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
    chainId: number | string = this.chain.id,
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
      createAccount(
        res.OK,
        this.chain.id,
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
    return canUserOpGetSponsor(userOp, this.chain.id, TEMP_ENTRY_POINT);
  }

  public async isSmartAccountDeployed(address: string) {
    const code = await this._sdk.provider.getCode(address);
    // when account is not deployed, it's code is undefined or 0x.
    return code !== undefined && code !== '0x';
  }

  // public async activateSmartAccount(address: string) {
  //   try {
  //     const userOp = await this.createUnsignedDeployWalletUserOp(address);
  //     await this.estimateGas(userOp);
  //     await this.sendUserOperation(userOp);
  //   } catch (error) {
  //     console.error('Elytro: Failed to activate smart account.', error);
  //   }
  // }

  public async sendUserOperation(userOp: ElytroUserOperation) {
    // estimate gas before sending userOp, but can not do it here (for the case of sign tx)
    // await this.estimateGas(userOp);

    const res = await this._sdk.sendUserOperation(userOp);

    if (res.isErr()) {
      throw res.ERR;
    } else {
      return res.OK;
    }
  }

  public async signUserOperation(userOp: ElytroUserOperation) {
    const opHash = await this._sdk.userOpHash(userOp);

    if (opHash.isErr()) {
      throw opHash.ERR;
    } else {
      const signature = await this._getSignature(
        opHash.OK,
        0, // 0
        Math.floor(new Date().getTime() / 1000) + 60 * 5 // 5 mins
      );
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
        if (res.OK.success) {
          // TODO: maybe return all fields, not just status?
          return UserOperationStatusEn.confirmedSuccess; //  res.OK.receipt;
        }

        return UserOperationStatusEn.confirmedFailed;
      }

      return UserOperationStatusEn.pending;
    } catch (error) {
      console.error('Elytro: Failed to get user operation receipt.', error);
      return UserOperationStatusEn.pending; // maybe error?
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

  private async _getSignature(
    messageHash: string,
    validStartTime?: number,
    validEndTime?: number
  ) {
    const rawHashRes = await this._sdk.packRawHash(
      messageHash,
      validStartTime,
      validEndTime
    );

    if (rawHashRes.isErr()) {
      throw rawHashRes.ERR;
    }

    // TODO： move sign userOp to wallet controller, so the keyring will be same instance
    await keyring.tryUnlock();

    // raw sign -> personal sign
    const _eoaSignature = await keyring.owner?.signMessage({
      message: { raw: rawHashRes.OK.packedHash as Hex },
    });

    if (!_eoaSignature) {
      throw new Error('Elytro: Failed to sign message.');
    }

    const signRes = await this._sdk.packUserOpEOASignature(
      this._config.validator,
      _eoaSignature,
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

    // todo: entrypoint should be dynamically changed with chainId?
    const res = await DecodeUserOp(this.chain.id, TEMP_ENTRY_POINT, userOp);

    if (res.isErr()) {
      throw res.ERR;
    } else {
      return res.OK;
    }
  }

  public async simulateUserOperation(userOp: ElytroUserOperation) {
    return await simulateSendUserOp(userOp, TEMP_ENTRY_POINT, this.chain.id);
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
    this._pimlicoRpc = this._pimlicoRpc
      ? this._pimlicoRpc
      : createPublicClient({
          chain: this.chain,
          transport: http(this._config.bundler),
        });

    // TODO: fix type
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
    }
  }

  public async getRechargeAmountForUserOp(
    userOp: ElytroUserOperation,
    transferValue: bigint
  ) {
    const res = await this._sdk.preFund(userOp);
    const hasSponsored = await this.canGetSponsored(userOp);

    if (res.isErr()) {
      throw res.ERR;
    } else {
      const {
        missfund,
        //deposit, prefund
      } = res.OK;

      const balance = await this._sdk.provider.getBalance(userOp.sender);
      const missAmount = hasSponsored
        ? transferValue - balance // why transferValue is not accurate? missfund is wrong during preFund?
        : BigInt(missfund) + transferValue - balance;

      return {
        balance, // user balance
        hasSponsored, // for this userOp, can get sponsored or not
        missAmount, // for this userOp, how much it needs to deposit
        needDeposit: missAmount > 0n, // need to deposit or not
        suspiciousOp: missAmount > parseEther('0.001'), // if missAmount is too large, it may considered suspicious
      } as TUserOperationPreFundResult;
    }
  }

  public async signMessage(
    message: Uint8Array | string | bigint | number | boolean | Hex,
    saAddress: Address
  ) {
    const rawMessage = getHexString(message, 32);

    const encode1271MessageHash = getEncoded1271MessageHash(rawMessage);
    const domainSeparator = getDomainSeparator(toHex(this.chain.id), saAddress);
    const encodedSHA = getEncodedSHA(domainSeparator, encode1271MessageHash);

    const signature = await this._getSignature(encodedSHA);
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

  public async sendTransaction(userOp: ElytroUserOperation) {
    try {
      // const userOp = await this.createUserOpFromTxs(tx);
      // todo: use outer gas estimation, not auto
      // await this.estimateGas(userOp, false);
      return await this.sendUserOperation(userOp);
    } catch (error) {
      console.error('Elytro:: send_transaction failed:', error);
      throw ethErrors.rpc.transactionRejected();
    }
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

export const elytroSDK = new ElytroSDK();
