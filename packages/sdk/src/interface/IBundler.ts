import { UserOperation } from './UserOperation.js';
import { UserOpErrors } from './IUserOpErrors.js';
import { Result } from '@elytro/result';
import { Address, BigNumberish, HexString } from './types.js';

export interface StateOverride {
  /**
   * Fake balance to set for the account before executing the call.
   */
  balance?: string;
  /**
   * Fake nonce to set for the account before executing the call.
   */
  nonce?: string;
  /**
   * Fake EVM bytecode to inject into the account before executing the call.
   */
  code?: string;
  /**
   * Fake key-value mapping to override all slots in the account storage before executing the call.
   */
  // eslint-disable-next-line
  state?: Object;
  /**
   * Fake key-value mapping to override individual slots in the account storage before executing the call.
   */
  // eslint-disable-next-line
  stateDiff?: Object;
}

/**
 *
 *
 * @export
 * @interface UserOpGas
 */
export interface UserOpGas {
  callGasLimit: string;
  paymasterPostOpGasLimit: string;
  paymasterVerificationGasLimit: string;
  preVerificationGas: string;
  verificationGasLimit: string;
}

/**
 *
 *
 * @export
 * @interface UserOpDetail
 * @extends {UserOperation}
 */
export interface UserOpDetail extends UserOperation {
  entryPoint: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
}
export interface UserOpReceiptLog {
  address: Address;
  blockHash: HexString;
  blockNumber: BigNumberish;
  data: HexString;
  logIndex: BigNumberish;
  // `undefined` if not supports EIP-1559
  removed: boolean | undefined;
  topics: HexString[];
  transactionHash: HexString;
  transactionIndex: BigNumberish;
}

export interface UserOpReceiptReceipt {
  blockHash: HexString;
  blockNumber: BigNumberish;
  cumulativeGasUsed: BigNumberish;
  effectiveGasPrice: BigNumberish;
  from: Address;
  gasUsed: BigNumberish;
  logsBloom: HexString;
  transactionHash: HexString;
  transactionIndex: BigNumberish;
  logs: UserOpReceiptLog[];
}

/**
 *
 *
 * @export
 * @interface UserOpReceipt
 * @extends {UserOperation}
 */
export interface UserOpReceipt {
  userOpHash: HexString;
  entryPoint: Address;
  sender: Address;
  nonce: BigNumberish;
  paymaster?: Address;
  actualGasCost: BigNumberish;
  actualGasUsed: BigNumberish;
  success: boolean;
  reason?: string;
  logs?: UserOpReceiptLog[];
  receipt?: UserOpReceiptReceipt;
}

/**
 *
 *
 * @export
 * @abstract
 * @class IBundler
 */
export abstract class IBundler {
  /**
   *
   *
   * @abstract
   * @param {string} entryPoint
   * @param {UserOperation} userOp
   * @return {*}  {Promise<Result<string, UserOpErrors>>}
   * @memberof IBundler
   */
  abstract eth_sendUserOperation(
    entryPoint: string,
    userOp: UserOperation
  ): Promise<Result<string, UserOpErrors>>;

  /**
   *
   *
   * @abstract
   * @param {string} entryPoint
   * @param {UserOperation} userOp
   * @param {StateOverride} [stateOverride]
   * @return {*}  {Promise<Result<UserOpGas, UserOpErrors>>}
   * @memberof IBundler
   */
  abstract eth_estimateUserOperationGas(
    entryPoint: string,
    userOp: UserOperation,
    stateOverride?: Record<string, StateOverride>
  ): Promise<Result<UserOpGas, UserOpErrors>>;

  /**
   *
   *
   * @abstract
   * @param {string} userOpHash
   * @return {*}  {(Promise<Result<null | UserOpDetail, string>>)}
   * @memberof IBundler
   */
  abstract eth_getUserOperationByHash(
    userOpHash: string
  ): Promise<Result<null | UserOpDetail, Error>>;

  /**
   *
   *
   * @abstract
   * @param {string} userOpHash
   * @return {*}  {(Promise<Result<null | UserOpReceipt, string>>)}
   * @memberof IBundler
   */
  abstract eth_getUserOperationReceipt(
    userOpHash: string
  ): Promise<Result<null | UserOpReceipt, Error>>;

  /**
   *
   *
   * @abstract
   * @return {*}  {Promise<Result<string[], string>>}
   * @memberof IBundler
   */
  abstract eth_supportedEntryPoints(): Promise<Result<string[], Error>>;

  /**
   *
   *
   * @abstract
   * @return {*}  {Promise<Result<number, string>>}
   * @memberof IBundler
   */
  abstract eth_chainId(): Promise<Result<number, Error>>;
}
