import { mutate_sponsor_op } from '@/requests/mutate';
import { mutate } from '@/requests';
import { paddingBytesToEven, formatHex } from '../format';
import { toHex } from 'viem';

export const canUserOpGetSponsor = async (userOp: ElytroUserOperation, chainID: number, entryPoint: string) => {
  try {
    const res = await mutate(mutate_sponsor_op, {
      input: {
        chainID: toHex(chainID),
        entryPoint,
        op: {
          sender: userOp.sender,
          nonce: formatHex(userOp.nonce),
          factory: userOp.factory,
          factoryData: userOp.factory === null ? null : paddingBytesToEven(userOp.factoryData ?? ''),
          callData: userOp.callData,
          callGasLimit: formatHex(userOp.callGasLimit),
          verificationGasLimit: formatHex(userOp.verificationGasLimit),
          preVerificationGas: formatHex(userOp.preVerificationGas),
          maxFeePerGas: formatHex(userOp.maxFeePerGas),
          maxPriorityFeePerGas: formatHex(userOp.maxPriorityFeePerGas),
          signature: userOp.signature,
        },
      },
    });
    const {
      paymaster,
      paymasterData,
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
      // @ts-ignore
    } = (res as SafeAny).sponsorOp; // TODO: add type definition

    Object.assign(userOp, {
      paymaster,
      paymasterData,
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
    });

    return true;
  } catch (error) {
    console.error('Elytro: Failed to check valid for sponsor.', error);
    return false;
  }
};
