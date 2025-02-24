import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import builtinProvider from '../builtinProvider';

export const callProvider: TFlowMiddleWareFn = async (ctx) => {
  const { rpcReq } = ctx.request;

  return await builtinProvider.request(rpcReq);
};
