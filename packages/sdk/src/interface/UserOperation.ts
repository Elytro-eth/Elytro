import { Address, BigNumberish, HexString, Bytes32 } from './types.js';

export type UserOperation = {
  sender: Address;
  nonce: BigNumberish;
  factory: Address | null;
  factoryData: HexString | null;
  callData: HexString;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymaster: Address | null;
  paymasterVerificationGasLimit: BigNumberish | null;
  paymasterPostOpGasLimit: BigNumberish | null;
  paymasterData: HexString | null;
  signature: HexString;
};

export type PackedUserOperation = {
  sender: Address;
  nonce: BigNumberish;
  initCode: HexString;
  callData: HexString;
  accountGasLimits: Bytes32;
  preVerificationGas: BigNumberish;
  gasFees: Bytes32;
  paymasterAndData: HexString;
  signature: HexString;
};
