import { UserOperation } from '@elytro/sdk';
import { Address, encodeAbiParameters, encodePacked } from 'viem';

// Helper function to create packed user operation from UserOperation
export function createPackedUserOp(userOp: UserOperation): SafeAny {
  // Create a properly packed UserOperation following EIP-4337 specifications
  const accountGasLimits = packUInts(BigInt(userOp.verificationGasLimit), BigInt(userOp.callGasLimit));
  const gasFees = packUInts(BigInt(userOp.maxPriorityFeePerGas), BigInt(userOp.maxFeePerGas));

  let paymasterAndData = '0x';
  if (userOp.paymaster && userOp.paymaster !== '0x0000000000000000000000000000000000000000') {
    paymasterAndData = packPaymasterData(
      userOp.paymaster as Address,
      BigInt(userOp.paymasterVerificationGasLimit || 0),
      BigInt(userOp.paymasterPostOpGasLimit || 0),
      userOp.paymasterData as `0x${string}`
    );
  }

  // Process initCode
  let initCode = '0x';
  if (userOp.factory) {
    // Correct format: initCode should be factory address + factoryData
    const factoryAddress = userOp.factory;
    const factoryData = userOp.factoryData ? userOp.factoryData : '0x';

    // Ensure factoryData has 0x prefix before removing it for concatenation
    const formattedFactoryData = factoryData.startsWith('0x') ? factoryData.slice(2) : factoryData;

    // Concatenate factory address and factoryData correctly
    initCode = factoryAddress.toLowerCase() + formattedFactoryData;

    // Ensure the final initCode has 0x prefix
    if (!initCode.startsWith('0x')) {
      initCode = '0x' + initCode;
    }
  }

  // Ensure callData has 0x prefix
  let callData = userOp.callData || '0x';
  if (!callData.startsWith('0x')) {
    callData = '0x' + callData;
  }

  // Convert nonce to a BigInt to ensure it's not treated as a hex string
  const nonce =
    typeof userOp.nonce === 'string' && userOp.nonce.startsWith('0x')
      ? BigInt(userOp.nonce) // Convert hex string to BigInt
      : userOp.nonce; // Keep as is if not a hex string

  // Convert preVerificationGas to a numeric value like nonce
  const preVerificationGas =
    typeof userOp.preVerificationGas === 'string' && userOp.preVerificationGas.startsWith('0x')
      ? BigInt(userOp.preVerificationGas) // Convert hex string to BigInt
      : userOp.preVerificationGas; // Keep as is if not a hex string

  return {
    sender: userOp.sender,
    nonce: nonce,
    initCode: initCode,
    callData: callData,
    accountGasLimits: accountGasLimits,
    preVerificationGas: preVerificationGas,
    gasFees: gasFees,
    paymasterAndData: paymasterAndData,
  };
}

// Pack two uint128 values into a bytes32
function packUInts(first: bigint, second: bigint): string {
  return encodePacked(['uint128', 'uint128'], [first, second]);
}

// Pack paymaster data into a standardized format
function packPaymasterData(
  paymaster: Address,
  verificationGasLimit: bigint,
  postOpGasLimit: bigint,
  data: `0x${string}`
): string {
  if (!paymaster || paymaster === '0x0000000000000000000000000000000000000000') {
    return '0x';
  }

  return encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint128' }, { type: 'uint128' }, { type: 'bytes' }],
    [paymaster, verificationGasLimit, postOpGasLimit, data || '0x']
  );
}
