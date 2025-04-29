import { ethers, keccak256 } from 'ethers';
import {
  UserOperation,
  PackedUserOperation,
} from '../interface/UserOperation.js';
import { packUserOp as userOp2PackedUserOp } from './convert.js';

/**
 * pack a PackedUserOperation into a string.
 *
 * @export
 * @param {PackedUserOperation} packedOp
 * @return {*}  {string}
 */
export function packUserOp(packedOp: PackedUserOperation): string {
  const abiCoder = new ethers.AbiCoder();
  return abiCoder.encode(
    [
      'address',
      'uint256',
      'bytes32',
      'bytes32',
      'bytes32',
      'uint256',
      'bytes32',
      'bytes32',
    ],
    [
      packedOp.sender,
      packedOp.nonce,
      keccak256(packedOp.initCode),
      keccak256(packedOp.callData),
      packedOp.accountGasLimits,
      packedOp.preVerificationGas,
      packedOp.gasFees,
      keccak256(packedOp.paymasterAndData),
    ]
  );
}

/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
export function getUserOpHash(
  op: UserOperation | PackedUserOperation,
  entryPoint: string,
  chainId: number
): string {
  let packedOp: PackedUserOperation;
  if ('verificationGasLimit' in op) {
    packedOp = userOp2PackedUserOp(op as UserOperation);
  } else {
    packedOp = op as PackedUserOperation;
  }
  const userOpHash = keccak256(packUserOp(packedOp));
  const enc = new ethers.AbiCoder().encode(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, entryPoint, chainId]
  );
  return keccak256(enc);
}
