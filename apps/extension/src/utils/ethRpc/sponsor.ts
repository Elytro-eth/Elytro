import { mutate_sponsor_op } from '@/requests/mutate';
import { mutate } from '@/requests';
import { paddingBytesToEven, formatHex } from '../format';
import { toHex } from 'viem';
import { FAKE_SECURITY_HOOK_BYTECODE } from '@/constants/securityHook';
import { THookStatus } from '@/types/securityHook';

export const canUserOpGetSponsor = async (
  userOp: ElytroUserOperation,
  chainID: number,
  entryPoint: string,
  hookStatus?: THookStatus
) => {
  try {
    const signatureToUse = hookStatus?.hasPreUserOpValidationHooks
      ? '0xea50a2874df3eec9e0365425ba948989cd63fed600000042009e07c6e2690d35c08a8fea58f03465f95f2918c15d715a1da4f0539b58e269487f712717427c9cb5030ace7a09f4df25e2de549e5dc420f08e69eaaa64acd43a1bd4e23c76e56532c0620f0b80e62918cc7ca9d44200000041df9f1a3ca8a5ac1b862edd9791c7975053bc760d6b9addee518eff34f1f130d2289886699b10e5f915aa47c5f915b1c755d7b915770ae38ad2398b69de3805fc1c'
      : '0xea50a2874df3eEC9E0365425ba948989cd63FED6000000620100005f5e0fff000fffffffff0000000000000000000000000000000000000000b91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c';

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
          signature: signatureToUse,
        },
        stateOverrides: hookStatus?.securityHookAddress
          ? {
              [hookStatus.securityHookAddress]: {
                code: FAKE_SECURITY_HOOK_BYTECODE,
              },
            }
          : undefined,
      },
    });

    if (!res || !(res as SafeAny).sponsorOp) {
      console.warn('Elytro: Sponsor not available - no sponsorOp in response');
      return false;
    }

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

    if (!paymaster) {
      console.warn('Elytro: Sponsor not available - missing paymaster address');
      return false;
    }

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
