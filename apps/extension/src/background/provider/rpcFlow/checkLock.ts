import keyring from '@/background/services/keyring';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import { approvalService } from '@/background/services/approval';
import { ethErrors } from 'eth-rpc-errors';
import { ApprovalTypeEn } from '@/constants/operations';

// todo: move to keyring service
let isUnlocking = false;

// TODO: check if other methods are private
const PRIVATE_METHODS: ProviderMethodType[] = [
  'eth_requestAccounts',
  'wallet_requestPermissions',
  'wallet_addEthereumChain',
  'wallet_switchEthereumChain',
  'wallet_revokePermissions',
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_getTransactionByHash',
  'eth_getEncryptionPublicKey',
  'eth_getCode',
  'eth_call',
  'eth_estimateGas',
];

const SEMI_PUBLIC_METHODS: ProviderMethodType[] = ['eth_accounts'];

export const checkLock: TFlowMiddleWareFn = async (ctx, next) => {
  const {
    rpcReq: { method },
  } = ctx.request;

  if (SEMI_PUBLIC_METHODS.includes(method)) {
    ctx.request.needConnection = true;
  } else if (PRIVATE_METHODS.includes(method)) {
    if (keyring.locked) {
      await keyring.tryUnlock();

      // only allow one unlocking request once at a time
      if (isUnlocking) {
        throw ethErrors.rpc.resourceNotFound(
          'Elytro: Unlocking in progress. Please wait.'
        );
      }

      try {
        isUnlocking = true;
        await approvalService.request(ApprovalTypeEn.Unlock);
      } finally {
        isUnlocking = false;
      }
    } else {
      isUnlocking = false;
    }
  }

  return next();
};
