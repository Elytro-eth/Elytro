import accountManager from '@/background/services/account';
import { approvalService, ApprovalTypeEn } from '@/background/services/approval';
import { ChainOperationEn, getChainNameByChainId, SUPPORTED_CHAIN_IDS } from '@/constants/chains';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import { ethErrors } from 'eth-rpc-errors';

const RELATED_METHODS: ProviderMethodType[] = ['wallet_switchEthereumChain', 'wallet_addEthereumChain'];

const CHAIN_OPERATION_MAP: Partial<Record<ProviderMethodType, ChainOperationEn>> = {
  wallet_switchEthereumChain: ChainOperationEn.Switch,
  wallet_addEthereumChain: ChainOperationEn.Update,
};

export const requestChain: TFlowMiddleWareFn = async (ctx, next) => {
  const {
    rpcReq: { method, params },
    dApp,
  } = ctx.request;

  if (!RELATED_METHODS.includes(method)) {
    return next();
  }

  // Hex to
  const { chainId } = params?.[0] ?? {};

  if (!chainId || !chainId.startsWith('0x') || Number.isNaN(Number(chainId))) {
    return ethErrors.provider.custom({
      code: 4902,
      message: 'Invalid chain ID',
    });
  }

  const operation = CHAIN_OPERATION_MAP[method as ProviderMethodType];

  if (!SUPPORTED_CHAIN_IDS.includes(Number(chainId))) {
    return await approvalService.request(ApprovalTypeEn.Alert, {
      dApp,
      options: {
        name: method,
        reason: `You are trying to ${operation} an unsupported chain: ${Number(chainId)}.`,
      },
    });
  }

  if (accountManager.currentAccount?.chainId === Number(chainId)) {
    return;
  }

  if (!accountManager.accounts.find((account) => account.chainId === Number(chainId))) {
    return await approvalService.request(ApprovalTypeEn.Alert, {
      dApp,
      options: {
        name: method,
        reason: `You are trying to switch to chain(${getChainNameByChainId(Number(chainId))}) that you don't have any account on.`,
      },
    });
  }

  return await approvalService.request(ApprovalTypeEn.ChainChange, {
    dApp,
    chain: {
      method: operation,
      ...params?.[0],
    },
  });
};
