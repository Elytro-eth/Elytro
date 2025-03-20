import {
  approvalService,
  ApprovalTypeEn,
} from '@/background/services/approval';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';

const SEND_TX_METHODS: ProviderMethodType[] = ['eth_sendTransaction'];

export const sendTx: TFlowMiddleWareFn = async (ctx, next) => {
  const {
    rpcReq: { method, params },
    dApp,
  } = ctx.request;

  if (SEND_TX_METHODS.includes(method)) {
    return await approvalService.request(ApprovalTypeEn.TxConfirm, {
      dApp,
      tx: params,
    });
  }

  return next();
};
