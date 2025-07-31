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
          signature:
            '0xea50a2874df3eEC9E0365425ba948989cd63FED6000000620100005f5e0fff000fffffffff0000000000000000000000000000000000000000b91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c',
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
