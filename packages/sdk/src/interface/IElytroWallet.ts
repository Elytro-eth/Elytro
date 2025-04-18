import { UserOperation } from './UserOperation.js';
import { UserOpErrors } from './IUserOpErrors.js';
import { Result } from '@elytro/result';
import { ECCPoint, RSAPublicKey } from '../tools/webauthn.js';
import { TypedDataDomain, TypedDataField } from 'ethers';
import { StateOverride, UserOpGas } from './IBundler.js';

/**
 * Transaction is the interface for the transaction.
 *
 * @export
 * @interface Transaction
 */
export interface Transaction {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
}

/**
 *
 *
 * @export
 * @abstract
 * @class IElytroWallet
 */
export abstract class IElytroWallet {
  /**
   * get entryPoint address from the elytrowallet contract.
   *
   * @abstract
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof IElytroWallet
   */
  abstract entryPoint(): Promise<Result<string, Error>>;

  /**
   * calcuate the wallet address from the index, initialKey and initialGuardianHash.
   *
   * @abstract
   * @param {number} index
   * @param {InitialKey[]} initialKeys
   * @param {string} initialGuardianHash
   * @param {number} [initialGuardianSafePeriod]
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof IElytroWallet
   */
  abstract calcWalletAddress(
    index: number,
    initialKeys: InitialKey[],
    initialGuardianHash: string,
    initialGuardianSafePeriod?: number
  ): Promise<Result<string, Error>>;

  /**
   * create unsigned deploy wallet UserOp.
   *
   * @abstract
   * @param {number} index
   * @param {InitialKey[]} initialKeys
   * @param {string} initialGuardianHash
   * @param {string} [callData]
   * @param {number} [initialGuardianSafePeriod]
   * @return {*}  {Promise<Result<UserOperation, Error>>}
   * @memberof IElytroWallet
   */
  abstract createUnsignedDeployWalletUserOp(
    index: number,
    initialKeys: InitialKey[],
    initialGuardianHash: string,
    callData?: string,
    initialGuardianSafePeriod?: number
  ): Promise<Result<UserOperation, Error>>;

  /**
   * get userOpHash from the userOp.
   *
   * @abstract
   * @param {UserOperation} userOp
   * @return {*}  {Promise<Result<string, Error>>}
   * @memberof IElytroWallet
   */
  abstract userOpHash(userOp: UserOperation): Promise<Result<string, Error>>;

  /**
   * get packed userOpHash from the userOp.
   *
   * @abstract
   * @param {UserOperation} userOp
   * @param {number} [validAfter]
   * @param {number} [validUntil]
   * @return {*}  {Promise<
   *         Result<{
   *             packedUserOpHash: string,
   *             validationData: string
   *         }, Error>
   *     >}
   * @memberof IElytroWallet
   */
  abstract packUserOpHash(
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
  >;

  /**
   * Estimate the gas for userOp and fill it into the userOp.
   *
   * @abstract
   * @param {string} validatorAddress validator contract address
   * @param {UserOperation} userOp UserOperation
   * @param {Record<string, StateOverride>} [stateOverride] stateOverride
   * @param {SignkeyType} [signkeyType] default: SignkeyType.EOA
   * @param {GuardHookInputData} [semiValidGuardHookInputData]  sender: wallet address, inputData: key: guardHookPlugin address, value: input data
   * @return {*}  {Promise<Result<UserOpGas, UserOpErrors>>}
   * @memberof IElytroWallet
   */
  abstract estimateUserOperationGas(
    validatorAddress: string,
    userOp: UserOperation,
    stateOverride?: Record<string, StateOverride>,
    signkeyType?: SignkeyType,
    semiValidGuardHookInputData?: GuardHookInputData
  ): Promise<Result<UserOpGas, UserOpErrors>>;

  /**
   * broadcast the userOp.
   *
   * @abstract
   * @param {UserOperation} userOp
   * @return {*}  {Promise<Result<true, UserOpErrors>>}
   * @memberof IElytroWallet
   */
  abstract sendUserOperation(
    userOp: UserOperation
  ): Promise<Result<true, UserOpErrors>>;

  /**
   * get wallet prefund.
   *
   * @abstract
   * @param {UserOperation} userOp UserOperation
   * @return {*}  {Promise<Result<{
   *         deposit: string,
   *         prefund: string,
   *         missfund: string
   *     }, Error>>} hex string, unit: wei
   * @memberof IElytroWallet
   */
  abstract preFund(userOp: UserOperation): Promise<
    Result<
      {
        deposit: string;
        prefund: string;
        missfund: string;
      },
      Error
    >
  >;

  /**
   * convert the transactions to unsigned userOp.
   *
   * @abstract
   * @param {string} maxFeePerGas hex string, unit: wei
   * @param {string} maxPriorityFeePerGas hex string, unit: wei
   * @param {string} from wallet address
   * @param {Transaction[]} txs transactions
   * @param {string} [nonce]
   * @return {*}  {Promise<Result<UserOperation, Error>>}
   * @memberof IElytroWallet
   */
  abstract fromTransaction(
    maxFeePerGas: string,
    maxPriorityFeePerGas: string,
    from: string,
    txs: Transaction[],
    nonce?: {
      nonceKey?: string;
      nonceValue?: string;
    }
  ): Promise<Result<UserOperation, Error>>;

  /**
   * get the nonce from the wallet.
   *
   * @abstract
   * @param {string} walletAddr wallet address
   * @param {string} [key] default: "0x0"
   * @return {*}  {Promise<Result<string, Error>>} hex string
   * @memberof IElytroWallet
   */
  abstract getNonce(
    walletAddr: string,
    key?: string
  ): Promise<Result<string, Error>>;

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
  abstract getEIP1271TypedData(
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
  >;
}

/**
 * GuardHookInputData is the input data for the guardHook.
 *
 * @export
 * @class GuardHookInputData
 */
export class GuardHookInputData {
  /**
   *
   *
   * @type {string} wallet address
   * @memberof GuardHookInputData
   */
  sender: string = '';
  /**
   *
   *
   * @type {Record<string, string>} key: guardHook address, value: input data
   * @memberof GuardHookInputData
   */
  inputData: Record<string, string> = {};
}

/**
 * Initial key of the wallet
 * ECCPoint, RSAPublicKey, EOA or packed bytes32
 */
export type InitialKey = ECCPoint | RSAPublicKey | string;

/**
 * Key type
 *
 * @export
 * @enum {number}
 */
export enum SignkeyType {
  EOA = 0,
  P256 = 1,
  RS256 = 2,
}
