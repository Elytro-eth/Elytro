import { TypedDataDomain, TypedDataField, ethers } from 'ethers';
import {
  GuardHookInputData,
  IElytroWallet,
  InitialKey,
  SignkeyType,
  Transaction,
} from './interface/IElytroWallet.js';
import { UserOperation } from './interface/UserOperation.js';
import { TypeGuard } from './tools/typeGuard.js';
import { MemCache } from './tools/memCache.js';
import { ABI_ElytroFactory, ABI_Elytro, ABI_EntryPoint } from '@elytro/abi';
import { HookInputData, Signature } from './tools/signature.js';
// import { Hex } from "./tools/hex.js";
// import { GasOverhead } from "./tools/gasOverhead.js";
import { UserOpErrors, UserOpErrorCodes } from './interface/IUserOpErrors.js';
import { Bundler } from './bundler.js';
import { Ok, Err, Result } from '@elytro/result';
import { getUserOpHash } from './tools/userOpHash.js';
//import { L1KeyStore } from "./L1KeyStore.js";
import { SocialRecovery } from './socialRecovery.js';
import { ECCPoint, RSAPublicKey } from './tools/webauthn.js';
import { WalletFactory } from './tools/walletFactory.js';
import { StateOverride, UserOpGas } from './interface/IBundler.js';
import { Address } from './interface/types.js';

export interface onChainConfig {
  chainId: number;
  entryPoint: Address;
  elytroWalletLogic: Address;
}

/**
 * main class of the SDK.
 *
 * @export
 * @class ElytroWallet
 * @implements {IElytroWallet}
 */
export class ElytroWallet implements IElytroWallet {
  readonly provider: ethers.JsonRpcProvider;
  readonly bundler: ethers.JsonRpcProvider;
  readonly elytroWalletFactoryAddress: string;
  readonly defalutCallbackHandlerAddress?: string;
  readonly socialRecoveryModuleAddress?: string;
  readonly preVerificationGasDeploy: number = 10000000;
  readonly Bundler: Bundler;
  private _onChainConfig: onChainConfig | undefined = undefined;

  /**
   * Creates an instance of ElytroWallet.
   * @param {(string | ethers.JsonRpcProvider)} _provider ethreum client rpc url
   * @param {(string | ethers.JsonRpcProvider)} _bundler eip-4337 bundler rpc url
   * @param {Address} _elytroWalletFactoryAddress elytroWalletFactory contract address
   * @param {Address} [_defalutCallbackHandlerAddress] default callback handler contract address
   * @param {Address} [_socialRecoveryModuleAddress] social recovery module contract address
   * @param {onChainConfig} [_config] if provided, skip onchain config check
   * @memberof ElytroWallet
   */
  constructor(
    _provider: string | ethers.JsonRpcProvider,
    _bundler: string | ethers.JsonRpcProvider,
    _elytroWalletFactoryAddress: Address,
    _defalutCallbackHandlerAddress?: Address,
    _socialRecoveryModuleAddress?: Address,
    _config?: onChainConfig
  ) {
    if (typeof _provider === 'string') {
      if (TypeGuard.httpOrHttps(_provider).isErr() === true)
        throw new Error('invalid provider');
      this.provider = new ethers.JsonRpcProvider(_provider);
    } else {
      this.provider = _provider;
    }
    if (typeof _bundler === 'string') {
      if (TypeGuard.httpOrHttps(_bundler).isErr() === true)
        throw new Error('invalid bundler');
      this.bundler = new ethers.JsonRpcProvider(_bundler, undefined, {
        batchMaxCount: 1,
      });
    } else {
      this.bundler = _bundler;
    }
    if (TypeGuard.onlyAddress(_elytroWalletFactoryAddress).isErr() === true)
      throw new Error('invalid elytroWalletFactoryAddress');
    // if (_defaultValidator !== undefined && TypeGuard.onlyAddress(_defaultValidator).isErr() === true) throw new Error("invalid defaultValidator");
    if (
      _defalutCallbackHandlerAddress !== undefined &&
      TypeGuard.onlyAddress(_defalutCallbackHandlerAddress).isErr() === true
    )
      throw new Error('invalid defalutCallbackHandlerAddress');
    if (
      _socialRecoveryModuleAddress !== undefined &&
      TypeGuard.onlyAddress(_socialRecoveryModuleAddress).isErr() === true
    )
      throw new Error('invalid keyStoreModuleAddress');
    // if (_securityControlModuleAddress !== undefined && TypeGuard.onlyAddress(_securityControlModuleAddress).isErr() === true) throw new Error("invalid securityControlModuleAddress");

    this.elytroWalletFactoryAddress = _elytroWalletFactoryAddress;
    this.defalutCallbackHandlerAddress = _defalutCallbackHandlerAddress;
    this.socialRecoveryModuleAddress = _socialRecoveryModuleAddress;
    // this.defaultValidator = _defaultValidator;
    this.Bundler = new Bundler(this.bundler);
    if (_config !== undefined) {
      this._onChainConfig = _config;
    }
  }

  async getOnChainConfig(): Promise<Result<onChainConfig, Error>> {
    if (this._onChainConfig) {
      return new Ok(this._onChainConfig);
    }
    let _chainId: number = 0;
    {
      const _chainIdBigint = (await this.provider.getNetwork()).chainId;
      _chainId = Number(_chainIdBigint);
      if (Number.isSafeInteger(_chainId)) {
        if (_chainId === 0) {
          return new Err(new Error('Invalid chainId'));
        }
      } else {
        return new Err(new Error('chainId is not a safe integer'));
      }
    }

    const key = `onChainConfig_${this.elytroWalletFactoryAddress}_${_chainId}`;
    // read from cache
    let _onChainConfig = MemCache.getInstance().get<onChainConfig | undefined>(
      key,
      undefined
    );
    if (!_onChainConfig) {
      const _elytroWalletFactory = new ethers.Contract(
        this.elytroWalletFactoryAddress,
        ABI_ElytroFactory,
        this.provider
      );
      const elytroWalletLogic: string = await _elytroWalletFactory
        .getFunction('_WALLETIMPL')
        .staticCall();
      const _elytroWallet = new ethers.Contract(
        elytroWalletLogic,
        ABI_Elytro,
        this.provider
      );
      const entryPoint: string = await _elytroWallet
        .getFunction('entryPoint')
        .staticCall();

      const _bundlerChainIdBigint = (await this.bundler.getNetwork()).chainId;
      const _bundlerChainId: number = Number(_bundlerChainIdBigint);
      if (Number.isSafeInteger(_bundlerChainId)) {
        if (_bundlerChainId === 0) {
          return new Err(new Error('Invalid bundler chainId'));
        }
      } else {
        return new Err(new Error('bundler chainId is not a safe integer'));
      }

      if (_chainId !== _bundlerChainId) {
        return new Err(new Error('chainId !== bundler chainId'));
      }

      _onChainConfig = {
        chainId: _chainId,
        entryPoint: entryPoint,
        elytroWalletLogic: elytroWalletLogic,
      } as onChainConfig;

      // save to cache
      MemCache.getInstance().set(key, _onChainConfig);

      // check bundler RPC
      const ret = await this.Bundler.eth_supportedEntryPoints();
      if (ret.isErr() === true) {
        return new Err(ret.ERR);
      }
      if (
        ret.OK.join().toLowerCase().indexOf(entryPoint.toLowerCase()) === -1
      ) {
        return new Err(
          new Error(`Bundler network doesn't support entryPoint ${entryPoint}`)
        );
      }

      {
        // check onchain::walletAddress == offchain::walletAddress
        const onChainAddress = await _elytroWalletFactory
          .getFunction('getWalletAddress')
          .staticCall('0x01', WalletFactory.calcWalletAddressSalt(1, _chainId));
        const offChainAddress = WalletFactory.getWalletAddressByIndex(
          this.elytroWalletFactoryAddress,
          elytroWalletLogic,
          '0x01',
          1,
          _chainId
        );
        if (onChainAddress.toLowerCase() !== offChainAddress.toLowerCase()) {
          return new Err(
            new Error(
              `onchain::walletAddress(${onChainAddress}) != offchain::walletAddress(${offChainAddress})`
            )
          );
        }
      }
    }
    this._onChainConfig = _onChainConfig;
    return new Ok(_onChainConfig);
  }

  private _entryPointContract: ethers.Contract | undefined;

  private async getEntryPointContract(): Promise<
    Result<ethers.Contract, Error>
  > {
    if (this._entryPointContract === undefined) {
      const _onChainConfig = await this.getOnChainConfig();
      if (_onChainConfig.isErr() === true) {
        return new Err(_onChainConfig.ERR);
      }
      this._entryPointContract = new ethers.Contract(
        _onChainConfig.OK.entryPoint,
        ABI_EntryPoint,
        this.provider
      );
    }
    return new Ok(this._entryPointContract);
  }

  async entryPoint(): Promise<Result<string, Error>> {
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(_onChainConfig.ERR);
    }
    return new Ok(_onChainConfig.OK.entryPoint);
  }

  static initializeData(
    socialRecoveryModuleAddress: string | undefined,
    defalutCallbackHandlerAddress: string | undefined,
    initialKeys: InitialKey[],
    initialGuardianHash: string = ethers.ZeroHash,
    initialGuardianSafePeriod: number = SocialRecovery.defalutInitialGuardianSafePeriod
  ): Result<string, Error> {
    /* 
                   function initialize(
                       bytes32[] anOwner,
                       address defalutCallbackHandler,
                       bytes[] calldata modules,
                       bytes[] calldata hooks
                   )
               */
    const modules: string[] = [];

    // if (this.securityControlModuleAddress !== undefined) {
    //     // default dely time is 2 days
    //     const securityControlModuleAndData = (this.securityControlModuleAddress + Hex.paddingZero(securityControlModuleDelay, 32).substring(2)).toLowerCase();
    //     modules.push(securityControlModuleAndData);
    // }
    if (socialRecoveryModuleAddress !== undefined) {
      if (initialGuardianHash === '0x') {
        initialGuardianHash = ethers.ZeroHash;
      }
      const socialRecoveryInitData = new ethers.AbiCoder().encode(
        ['bytes32', 'uint256'],
        [initialGuardianHash, initialGuardianSafePeriod]
      );
      const socialRecoveryModuleAndData = (
        socialRecoveryModuleAddress + socialRecoveryInitData.substring(2)
      ).toLowerCase();
      modules.push(socialRecoveryModuleAndData);
    }

    const interfaceElytroWallet = new ethers.Interface(ABI_Elytro);
    const initializeData = interfaceElytroWallet.encodeFunctionData(
      'initialize',
      [
        SocialRecovery.initialKeysToAddress(initialKeys),
        defalutCallbackHandlerAddress === undefined
          ? ethers.ZeroAddress
          : defalutCallbackHandlerAddress,
        modules,
        [],
      ]
    );

    return new Ok(initializeData);
  }

  async initializeData(
    initialKeys: InitialKey[],
    initialGuardianHash: string = ethers.ZeroHash,
    initialGuardianSafePeriod: number = SocialRecovery.defalutInitialGuardianSafePeriod
  ): Promise<Result<string, Error>> {
    return ElytroWallet.initializeData(
      this.socialRecoveryModuleAddress,
      this.defalutCallbackHandlerAddress,
      initialKeys,
      initialGuardianHash,
      initialGuardianSafePeriod
    );
  }

  /**
   * get wallet address by index
   *
   * @param {number} index readable index
   * @param {InitialKey[]} initialKeys initial keys
   * @param {string} initialGuardianHash initial guardian hash
   * @param {number} [initialGuardianSafePeriod] initial guardian safe period
   * @param {(number | string)} [chainId] number or hex string(must start with 0x)
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof ElytroWallet
   */
  async calcWalletAddress(
    index: number,
    initialKeys: InitialKey[],
    initialGuardianHash: string,
    initialGuardianSafePeriod?: number,
    chainId?: number | string
  ): Promise<Result<string, Error>> {
    const _initializeDataRet = await this.initializeData(
      initialKeys,
      initialGuardianHash,
      initialGuardianSafePeriod
    );
    if (_initializeDataRet.isErr() === true) {
      return new Err(_initializeDataRet.ERR);
    }
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      throw new Err(_onChainConfig.ERR);
    }
    return new Ok(
      WalletFactory.getWalletAddressByIndex(
        this.elytroWalletFactoryAddress,
        _onChainConfig.OK.elytroWalletLogic,
        _initializeDataRet.OK,
        index,
        chainId === undefined ? _onChainConfig.OK.chainId : chainId
      )
    );
  }

  async preFund(userOp: UserOperation): Promise<
    Result<
      {
        deposit: string;
        prefund: string;
        missfund: string;
      },
      Error
    >
  > {
    try {
      const maxFeePerGas = BigInt(userOp.maxFeePerGas);
      let paymasterVerificationGasLimit = BigInt(0);
      if (userOp.paymasterVerificationGasLimit !== null) {
        paymasterVerificationGasLimit = BigInt(
          userOp.paymasterVerificationGasLimit
        );
      }
      let paymasterPostOpGasLimit = BigInt(0);
      if (userOp.paymasterPostOpGasLimit !== null) {
        paymasterPostOpGasLimit = BigInt(userOp.paymasterPostOpGasLimit);
      }
      const requiredGas =
        BigInt(userOp.verificationGasLimit) +
        BigInt(userOp.callGasLimit) +
        BigInt(userOp.preVerificationGas) +
        paymasterVerificationGasLimit +
        paymasterPostOpGasLimit;
      const requiredPrefund = requiredGas * maxFeePerGas;

      //return '0x' + requiredPrefund.toString(16);

      const _onChainConfig = await this.getOnChainConfig();
      if (_onChainConfig.isErr() === true) {
        throw new Err(_onChainConfig.ERR);
      }

      const _entrypointRet = await this.getEntryPointContract();
      if (_entrypointRet.isErr() === true) {
        return new Err(_entrypointRet.ERR);
      }

      // balanceOf(): uint256
      const _deposit: bigint = await _entrypointRet.OK.getFunction(
        'balanceOf'
      ).staticCall(userOp.sender);

      const _missfund =
        _deposit < requiredPrefund ? requiredPrefund - _deposit : BigInt(0);

      const data = {
        deposit: '0x' + _deposit.toString(16),
        prefund: '0x' + requiredPrefund.toString(16),
        missfund: '0x' + _missfund.toString(16),
      };
      return new Ok(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  async createUnsignedDeployWalletUserOp(
    index: number,
    initialKeys: InitialKey[],
    initialGuardianHash: string,
    callData: string = '0x',
    initialGuardianSafePeriod?: number
  ): Promise<Result<UserOperation, Error>> {
    const ret = TypeGuard.onlyBytes(callData);
    if (ret.isErr() === true) {
      return new Err(new Error(ret.ERR));
    }
    const _initializeData = await this.initializeData(
      initialKeys,
      initialGuardianHash,
      initialGuardianSafePeriod
    );
    if (_initializeData.isErr() === true) {
      return new Err(_initializeData.ERR);
    }
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      throw new Err(_onChainConfig.ERR);
    }

    const factory = this.elytroWalletFactoryAddress;
    const factoryData = `${new ethers.Interface(ABI_ElytroFactory)
      .encodeFunctionData('createWallet', [
        _initializeData.OK,
        WalletFactory.calcWalletAddressSalt(index, _onChainConfig.OK.chainId),
      ])
      .substring(2)}`.toLowerCase();
    const senderRet = await this.calcWalletAddress(
      index,
      initialKeys,
      initialGuardianHash,
      initialGuardianSafePeriod
    );
    if (senderRet.isErr() === true) {
      return new Err(senderRet.ERR);
    }
    const _userOperation: UserOperation = {
      sender: senderRet.OK,
      nonce: 0,
      factory,
      factoryData,
      callData,
      callGasLimit: 0,
      verificationGasLimit: 0,
      preVerificationGas: this.preVerificationGasDeploy,
      maxFeePerGas: 2,
      maxPriorityFeePerGas: 1,
      paymaster: null,
      paymasterVerificationGasLimit: null,
      paymasterPostOpGasLimit: null,
      paymasterData: null,
      signature: '0x',
    };

    return new Ok(_userOperation);
  }

  async userOpHash(userOp: UserOperation): Promise<Result<string, Error>> {
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(_onChainConfig.ERR);
    }
    return new Ok(
      getUserOpHash(
        userOp,
        _onChainConfig.OK.entryPoint,
        _onChainConfig.OK.chainId
      )
    );
  }

  async packUserOpHash(
    userOp: UserOperation,
    validAfter?: number,
    validUntil?: number
  ): Promise<
    Result<
      {
        packedUserOpHash: string;
        validationData: string;
      },
      Error
    >
  > {
    const userOPHashRet = await this.userOpHash(userOp);
    if (userOPHashRet.isErr() === true) {
      return new Err(userOPHashRet.ERR);
    }
    return new Ok(
      Signature.packUserOpHash(userOPHashRet.OK, validAfter, validUntil)
    );
  }

  async packRawHash(
    hash: string,
    validAfter?: number,
    validUntil?: number
  ): Promise<
    Result<
      {
        packedHash: string;
        validationData: string;
      },
      Error
    >
  > {
    const ret = Signature.packUserOpHash(hash, validAfter, validUntil);
    return new Ok({
      packedHash: ret.packedUserOpHash,
      validationData: ret.validationData,
    });
  }

  private async guardHookList(
    walletAddress: string
  ): Promise<Result<string[], Error>> {
    try {
      const _elytroWallet = new ethers.Contract(
        walletAddress,
        ABI_Elytro,
        this.provider
      );
      // function listPlugin(uint8 hookType) external view returns (address[] memory plugins);
      const _guardHookList = await _elytroWallet.listPlugin(
        1 /* uint8 private constant _GUARD_HOOK = 1 << 0; */
      );
      return new Ok(_guardHookList);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async prePackUserOpSignature(
    guardHookInputData?: GuardHookInputData
  ): Promise<Result<HookInputData | undefined, Error>> {
    let hookInputData: HookInputData | undefined = undefined;
    if (guardHookInputData !== undefined) {
      const ret = TypeGuard.onlyAddress(guardHookInputData.sender);
      if (ret.isErr() === true) {
        throw new Error(`invalid sender: ${guardHookInputData.sender}`);
      }
      hookInputData = new HookInputData();
      const guardHooksRet = await this.guardHookList(guardHookInputData.sender);
      if (guardHooksRet.isErr() === true) {
        return new Err(guardHooksRet.ERR);
      }
      hookInputData.guardHooks = guardHooksRet.OK;
      hookInputData.inputData = guardHookInputData.inputData;
    }
    return new Ok(hookInputData);
  }

  /**
   * pack userOp signature (EOA)
   *
   * @param {string} validatorAddress validator contract address
   * @param {string} signature EOA signature
   * @param {string} validationData validation data
   * @param {GuardHookInputData} [guardHookInputData]
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof ElytroWallet
   */
  async packUserOpEOASignature(
    validatorAddress: string,
    signature: string,
    validationData: string,
    guardHookInputData?: GuardHookInputData
  ): Promise<Result<string, Error>> {
    const hookInputData = await this.prePackUserOpSignature(guardHookInputData);
    if (hookInputData.isErr() === true) {
      return new Err(hookInputData.ERR);
    }
    return new Ok(
      Signature.packEOASignature(
        validatorAddress,
        signature,
        validationData,
        hookInputData.OK
      )
    );
  }

  /**
   * pack userOp signature (P256)
   *
   * @param validatorAddress validator contract address
   * @param {{
   *         messageHash:string,
   *         publicKey: InitialKey,
   *         r: string,
   *         s: string,
   *         authenticatorData: string,
   *         clientDataSuffix: string
   *     }} signatureData signature data, messageHash is userOp hash(packed userOp hash)
   * @param {string} validationData validation data
   * @param {GuardHookInputData} [guardHookInputData]
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof ElytroWallet
   */
  async packUserOpP256Signature(
    validatorAddress: string,
    signatureData: {
      messageHash: string;
      publicKey: ECCPoint | string;
      r: string;
      s: string;
      authenticatorData: string;
      clientDataSuffix: string;
    },
    validationData: string,
    guardHookInputData?: GuardHookInputData
  ): Promise<Result<string, Error>> {
    const hookInputData = await this.prePackUserOpSignature(guardHookInputData);
    if (hookInputData.isErr() === true) {
      return new Err(hookInputData.ERR);
    }
    return new Ok(
      Signature.packP256Signature(
        validatorAddress,
        signatureData,
        validationData,
        hookInputData.OK
      )
    );
  }

  /**
   * pack userOp signature (RS256)
   *
   * @param validatorAddress validator contract address
   * @param {{
   *             messageHash:string,
   *             publicKey: InitialKey,
   *             r: string,
   *             s: string,
   *             authenticatorData: string,
   *             clientDataSuffix: string
   *         }} signatureData
   * @param {string} validationData
   * @param {HookInputData} [guardHookInputData]
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof ElytroWallet
   */
  async packUserOpRS256Signature(
    validatorAddress: string,
    signatureData: {
      messageHash: string;
      publicKey: RSAPublicKey;
      signature: string;
      authenticatorData: string;
      clientDataSuffix: string;
    },
    validationData: string,
    guardHookInputData?: GuardHookInputData
  ): Promise<Result<string, Error>> {
    const hookInputData = await this.prePackUserOpSignature(guardHookInputData);
    if (hookInputData.isErr() === true) {
      return new Err(hookInputData.ERR);
    }
    return new Ok(
      Signature.packRS256Signature(
        validatorAddress,
        signatureData,
        validationData,
        hookInputData.OK
      )
    );
  }

  async getSemiValidSignature(
    validatorAddress: string,
    userOp: UserOperation,
    signkeyType?: SignkeyType,
    semiValidGuardHookInputData?: GuardHookInputData
  ): Promise<Result<string, UserOpErrors>> {
    if (semiValidGuardHookInputData !== undefined) {
      if (
        semiValidGuardHookInputData.sender.toLowerCase() !==
        userOp.sender.toLowerCase()
      ) {
        return new Err(
          new UserOpErrors(
            UserOpErrorCodes.UnknownError,
            `invalid sender: ${semiValidGuardHookInputData.sender}`
          )
        );
      }
      if (
        userOp.factory === null ||
        userOp.factory === '' ||
        userOp.factory === '0x' ||
        userOp.factory === ethers.ZeroAddress
      ) {
        return new Err(
          new UserOpErrors(
            UserOpErrorCodes.UnknownError,
            `cannot set semiValidGuardHookInputData when the contract wallet is not deployed`
          )
        );
      }
    }
    // semiValidSignature
    const validationData =
      (BigInt(68719476735) << BigInt(160)) +
      (BigInt(1599999999) << BigInt(160 + 48));
    let signatureRet: Result<string, Error>;
    if (signkeyType === SignkeyType.P256) {
      signatureRet = await this.packUserOpP256Signature(
        validatorAddress,
        {
          messageHash:
            '0x83714056da6e6910b51595330c2c2cdfbf718f2deff5bdd84b95df7a7f36f6dd',
          publicKey: {
            x: '0xe89e8b4be943fadb4dc599fe2e8af87a79b438adde328a3b72d43324506cd5b6',
            y: '0x4fbfe4a2f9934783c3b1af712ee87abc08f576e79346efc3b8355d931bd7b976',
          },
          r: '0x2ae3ddfe4cc414dc0fad7ff3a5c960d1cee1211722d3099ade76e5ac1826731a',
          s: '0x87e5d654f357e4cd6cb52512b2da4d91eae0ae48e9d892ce532b9352f63a55d6',
          authenticatorData:
            '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
          clientDataSuffix:
            '","origin":"http://localhost:5500","crossOrigin":false}',
        },
        `0x${validationData.toString(16)}`,
        semiValidGuardHookInputData
      );
    } else if (signkeyType === SignkeyType.RS256) {
      signatureRet = await this.packUserOpRS256Signature(
        validatorAddress,
        {
          messageHash:
            '0x83714056da6e6910b51595330c2c2cdfbf718f2deff5bdd84b95df7a7f36f6dd',
          publicKey: {
            e: '0x010001',
            n: '0xc6807412ed8d616565508c879292686bb1db6f0561b62c7b66a2d3806d161c0ccef888d2c1efcf061e268a15e61e7d023646014c33b1ead31bef0e5379558e6ff71249b143c03abec33a2b055fc8e0a947393512e7e26ad33f0ad4aabfe32d0642965856d8e20204a44d78e36cc90db2a12cfbc37fa97360efd3a735c625ab814d6f6bb7c63abe261bbd9c52681c6221f936d617dc84de61556074f6c1d73b3ffd242d2940d3c02c5a269e390bd8e6b6301a5a0a339910f6480403d27d32c2ff2b9bf33bae45c36f423025ca41f05c97be5148b2cb276b31441274100bf3ca0b50da1ee04511be9bdbb4f12b7579ab3da780bc2c615e2a49f5e1f750b034d0af',
          },
          signature:
            '0x357a51b26e22dcfb87346bb6938cfb2b066d48d4c36cafd30ac105fe345199966f24c87fa66791d4c2341b97fa07421ef4115a9923e6249c53887b6f2313df60654083758fe7104286490e1a37481246395dcb097a86645dc3251afa5c87e4bc8f2960cfe3efa34c44bbee0fe3d602866c81a5fc432709443c623595556670a427502c63c1e6a86761c8b326b5f503bdcfdcf1f00871f330a9fddf6ae11adcff4a5f411edec30019c86936f8064b70f88cdb56ba6635175f7ef5c74f52de9db5498e4c4d4b75c8a3210e5b1a631af271c4b613a8752b2a1cea499bd81115d9ed34305d9ab4af753dc9b9630478fdb0787e5f5e0efb76504d15eff5fd02a38bf1',
          authenticatorData:
            '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
          clientDataSuffix:
            '","origin":"http://localhost:5500","crossOrigin":false}',
        },
        `0x${validationData.toString(16)}`,
        semiValidGuardHookInputData
      );
    } else {
      const signature =
        '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c';
      signatureRet = await this.packUserOpEOASignature(
        validatorAddress,
        signature,
        `0x${validationData.toString(16)}`,
        semiValidGuardHookInputData
      );
    }
    if (signatureRet.isErr() === true) {
      return new Err(
        new UserOpErrors(
          UserOpErrorCodes.UnknownError,
          signatureRet.ERR.message
        )
      );
    }
    return new Ok(signatureRet.OK);
  }

  async estimateUserOperationGas(
    validatorAddress: string,
    userOp: UserOperation,
    stateOverride?: Record<string, StateOverride>,
    signkeyType?: SignkeyType,
    semiValidGuardHookInputData?: GuardHookInputData
  ): Promise<Result<UserOpGas, UserOpErrors>> {
    const semiValidSignature = userOp.signature === '0x';
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(
        new UserOpErrors(
          UserOpErrorCodes.UnknownError,
          _onChainConfig.ERR.message
        )
      );
    }
    try {
      if (semiValidSignature) {
        const re = await this.getSemiValidSignature(
          validatorAddress,
          userOp,
          signkeyType,
          semiValidGuardHookInputData
        );
        if (re.isErr() === true) {
          return new Err(re.ERR);
        }
        userOp.signature = re.OK;
      }
      const userOpGasRet = await this.Bundler.eth_estimateUserOperationGas(
        _onChainConfig.OK.entryPoint,
        userOp,
        stateOverride
      );
      if (userOpGasRet.isErr() === true) {
        return new Err(userOpGasRet.ERR);
      }

      // userOp.callGasLimit = `0x${BigInt(userOpGasRet.OK.callGasLimit).toString(16)}`;
      // userOp.paymasterPostOpGasLimit = `0x${BigInt(userOpGasRet.OK.paymasterPostOpGasLimit).toString(16)}`;
      // userOp.paymasterVerificationGasLimit = `0x${BigInt(userOpGasRet.OK.paymasterVerificationGasLimit).toString(16)}`;
      // userOp.preVerificationGas = `0x${BigInt(userOpGasRet.OK.preVerificationGas).toString(16)}`;
      // userOp.verificationGasLimit = `0x${BigInt(userOpGasRet.OK.verificationGasLimit).toString(16)}`;

      //GasOverhead.calcGasOverhead(userOp, signkeyType);

      return new Ok(userOpGasRet.OK);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(
          new UserOpErrors(UserOpErrorCodes.UnknownError, error.message)
        );
      } else {
        return new Err(
          new UserOpErrors(UserOpErrorCodes.UnknownError, 'unknown error')
        );
      }
    } finally {
      if (semiValidSignature) {
        userOp.signature = '0x';
      }
    }
  }

  async sendUserOperation(
    userOp: UserOperation
  ): Promise<Result<true, UserOpErrors>> {
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(
        new UserOpErrors(
          UserOpErrorCodes.UnknownError,
          _onChainConfig.ERR.message
        )
      );
    }
    const sendUserOpRet = await this.Bundler.eth_sendUserOperation(
      _onChainConfig.OK.entryPoint,
      userOp
    );
    if (sendUserOpRet.isErr() === true) {
      return new Err(sendUserOpRet.ERR);
    }
    const userOPHashLocal = await this.userOpHash(userOp);
    if (userOPHashLocal.isErr() === true) {
      return new Err(
        new UserOpErrors(
          UserOpErrorCodes.UnknownError,
          userOPHashLocal.ERR.message
        )
      );
    }
    if (sendUserOpRet.OK.toLowerCase() !== userOPHashLocal.OK.toLowerCase()) {
      throw new Error('userOpHash !== userOPHashLocal');
    }
    return new Ok(true);
  }

  async getNonce(
    walletAddr: string,
    key?: string
  ): Promise<Result<string, Error>> {
    let _key = '0x0';
    if (key !== undefined) {
      const ret = TypeGuard.maxToUint192(key);
      if (ret.isErr() === true) {
        return new Err(new Error(ret.ERR));
      }
      _key = '0x' + ret.OK.toString(16);
    }
    const _entrypointRet = await this.getEntryPointContract();
    if (_entrypointRet.isErr() === true) {
      return new Err(_entrypointRet.ERR);
    }
    try {
      const _nonce: bigint = await _entrypointRet.OK.getFunction(
        'getNonce'
      ).staticCall(walletAddr, _key);
      return new Ok(`0x${_nonce.toString(16)}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  private async walletDeployed(
    walletAddress: string
  ): Promise<Result<boolean, Error>> {
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(_onChainConfig.ERR);
    }
    const key = `${walletAddress}-${_onChainConfig.OK.chainId}`;

    if (MemCache.getInstance().get<boolean>(key, false)) {
      return new Ok(true);
    }
    try {
      const code = await this.provider.getCode(walletAddress);
      const deployed = code !== '0x';
      if (deployed) {
        MemCache.getInstance().set(key, true);
      }
      return new Ok(deployed);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        return new Err(new Error('unknown error'));
      }
    }
  }

  async fromTransaction(
    maxFeePerGas: string,
    maxPriorityFeePerGas: string,
    from: string,
    txs: Transaction[],
    nonce?: {
      nonceKey?: string;
      nonceValue?: string;
    }
  ): Promise<Result<UserOperation, Error>> {
    if (txs.length === 0) {
      return new Err(new Error('txs.length === 0'));
    }
    if (TypeGuard.onlyAddress(from).isErr() === true) {
      return new Err(new Error(`invalid from: ${from}`));
    }
    const _walletDeployed = await this.walletDeployed(from);
    if (_walletDeployed.isErr() === true) {
      return new Err(_walletDeployed.ERR);
    }
    if (_walletDeployed.isErr() === true) {
      new Error(`walletDeployed error: ${_walletDeployed.ERR.message}`);
    }

    let callGasLimit: bigint = BigInt(0);
    for (const tx of txs) {
      if (tx.gasLimit === undefined) {
        callGasLimit = BigInt(0);
        break;
      }
      callGasLimit += BigInt(tx.gasLimit);
    }
    {
      if (callGasLimit % BigInt(2) === BigInt(1)) {
        // odd number -> even number
        callGasLimit += BigInt(1);
      }
    }
    let nonceKey: string | undefined = undefined;
    let nonceValue: string | undefined = undefined;
    if (nonce !== undefined) {
      nonceKey = nonce.nonceKey;
      nonceValue = nonce.nonceValue;
    }
    if (nonceValue === undefined) {
      const nonceRet = await this.getNonce(from, nonceKey);
      if (nonceRet.isErr() === true) {
        return new Err(nonceRet.ERR);
      }
      nonceValue = nonceRet.OK;
    }

    if (TypeGuard.onlyHex(nonceValue!).isErr() === true) {
      return new Err(new Error(`invalid nonce: ${nonceValue}`));
    }

    let callData: string = '0x';
    {
      /*
                function execute(address dest, uint256 value, bytes calldata func) external;
                function executeBatch(address[] calldata dest, bytes[] calldata func) external;
                function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external;
            */
      const abi = new ethers.Interface(ABI_Elytro);

      const to: string[] = [];
      const value: string[] = [];
      const data: string[] = [];
      for (let i = 0; i < txs.length; i++) {
        const _to = txs[i].to;
        if (TypeGuard.onlyAddress(_to).isErr() === true)
          return new Err(new Error(`invalid to: ${to}`));
        to.push(_to);

        const _valueTmp = txs[i].value;
        const _value =
          _valueTmp === undefined
            ? '0x0'
            : '0x' + BigInt(_valueTmp).toString(16);
        value.push(_value);

        const _dataTmp = txs[i].data;
        const _data = _dataTmp === undefined ? '0x' : _dataTmp;
        if (TypeGuard.onlyBytes(_data).isErr() === true)
          return new Err(new Error(`invalid data: ${_data}`));
        data.push(_data);
      }

      if (txs.length > 1) {
        const executions: string[][] = [];
        for (let i = 0; i < to.length; i++) {
          const execution: string[] = [to[i], value[i], data[i]];
          executions.push(execution);
        }
        callData = abi.encodeFunctionData(
          'executeBatch((address,uint256,bytes)[])',
          [executions]
        );
      } else {
        callData = abi.encodeFunctionData('execute', [
          to[0],
          value[0],
          data[0],
        ]);
      }
    }

    const _userOperation: UserOperation = {
      sender: from,
      nonce: nonceValue!,
      /* 
             address factory = address(bytes20(initCode[0 : 20]));
             bytes memory initCallData = initCode[20 :];
             call(gas(), factory, 0, add(initCallData, 0x20), mload(initCallData), 0, 32)
              function createWallet(bytes memory _initializer, bytes32 _salt)
            */
      factory: null,
      factoryData: null,
      callData: callData,
      callGasLimit: '0x' + callGasLimit.toString(16),
      verificationGasLimit: 0,
      preVerificationGas: 0,
      maxFeePerGas: '0x' + BigInt(maxFeePerGas).toString(16),
      maxPriorityFeePerGas: '0x' + BigInt(maxPriorityFeePerGas).toString(16),
      paymaster: null,
      paymasterVerificationGasLimit: null,
      paymasterPostOpGasLimit: null,
      paymasterData: null,
      signature: '0x',
    };

    return new Ok(_userOperation);
  }

  /**
   * get TypedData from EIP1271.
   *
   * @abstract
   * @param {string} walletAddr
   * @param {string} message
   * @return {*}  {Promise<Result<{
   *         domain: TypedDataDomain,
   *         types: Record<string, Array<TypedDataField>>,
   *         // eslint-disable-next-line @typescript-eslint/no-explicit-any
   *         value: Record<string, any>,
   *         typedMessage: string
   *     }, Error>>}
   * @memberof IElytroWallet
   */
  async getEIP1271TypedData(
    walletAddr: string,
    message: string
  ): Promise<
    Result<
      {
        domain: TypedDataDomain;
        types: Record<string, Array<TypedDataField>>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: Record<string, any>;
        typedMessage: string;
      },
      Error
    >
  > {
    if (TypeGuard.onlyBytes32(message).isErr() === true) {
      return new Err(new Error(`invalid message: ${message}`));
    }
    const _onChainConfig = await this.getOnChainConfig();
    if (_onChainConfig.isErr() === true) {
      return new Err(_onChainConfig.ERR);
    }
    /* 
            keccak256("ElytroMessage(bytes32 message)");
            
            keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");
            
        */
    const domain: TypedDataDomain = {
      chainId: _onChainConfig.OK.chainId,
      verifyingContract: ethers.getAddress(walletAddr),
    };
    const types: Record<string, Array<TypedDataField>> = {
      elytroWalletMessage: [{ name: 'message', type: 'bytes32' }],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: Record<string, any> = {
      message: message,
    };

    const typedMessage = ethers.TypedDataEncoder.hash(domain, types, value);

    return new Ok({
      domain,
      types,
      value,
      typedMessage,
    });
  }
}
