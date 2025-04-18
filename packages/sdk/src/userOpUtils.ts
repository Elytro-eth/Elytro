import {
  PackedUserOperation,
  UserOperation,
} from './interface/UserOperation.js';
import {
  packedUserOperationToTuple,
  packedUserOperationToJSON,
  userOperationFromJSON,
  userOperationToJSON,
  packUserOp,
  unpackUserOp,
} from './tools/convert.js';
import { getUserOpHash } from './tools/userOpHash.js';

/**
 * UserOpUtils
 *
 * @export
 * @class UserOpUtils
 */
export class UserOpUtils {
  static packedUserOperationToTuple(packedUserOp: PackedUserOperation): string {
    return packedUserOperationToTuple(packedUserOp);
  }

  /**
   * packedUserOperationToJSON
   *
   * @static
   * @param {PackedUserOperation} packedUserOp
   * @return {*}  {string}
   * @memberof UserOpUtils
   */
  static packedUserOperationToJSON(packedUserOp: PackedUserOperation): string {
    return packedUserOperationToJSON(packedUserOp);
  }

  /**
   * userOperationToJSON
   *
   * @static
   * @param {UserOperation} userOp UserOperation
   * @return {*}  {string} json
   * @memberof UserOpUtils
   */
  static userOperationToJSON(userOp: UserOperation): string {
    return userOperationToJSON(userOp);
  }

  /**
   * userOperationFromJSON
   *
   * @static
   * @param {string} json
   * @return {*}  {UserOperation} UserOperation
   * @memberof UserOpUtils
   */
  static userOperationFromJSON(json: string): UserOperation {
    return userOperationFromJSON(json);
  }

  /**
   * getUserOpHash
   *
   * @static
   * @param {UserOperation} userOp UserOperation
   * @param {string} entryPoint entryPoint contract address
   * @param {number} chainId chainId
   * @return {*}  {string}
   * @memberof UserOpUtils
   */
  static getUserOpHash(
    userOp: UserOperation | PackedUserOperation,
    entryPoint: string,
    chainId: number
  ): string {
    return getUserOpHash(userOp, entryPoint, chainId);
  }

  /**
   * packUserOp
   *
   * @static
   * @param {UserOperation} userOp
   * @return {*}  {PackedUserOperation}
   * @memberof UserOpUtils
   */
  static packUserOp(userOp: UserOperation): PackedUserOperation {
    return packUserOp(userOp);
  }

  /**
   * unpackUserOp
   *
   * @static
   * @param {PackedUserOperation} packedUserOp
   * @return {*}  {UserOperation}
   * @memberof UserOpUtils
   */
  static unpackUserOp(packedUserOp: PackedUserOperation): UserOperation {
    return unpackUserOp(packedUserOp);
  }
}
