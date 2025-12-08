import AsyncTaskFlow from '@/utils/asyncTaskFlow';
import { checkMethodExist } from './checkCallable';
import { callProvider } from './callProvider';
import { requestConnect } from './requestConnect';
import { sendTx } from './sendTx';
import { requestSignature } from './requestSignature';
import { requestChain } from './requestChain';
import { eip5792Calls } from './eip5792Calls';

export type TProviderRequest = {
  ctx?: unknown;
  dApp: TDAppInfo;
  origin?: string;
  needConnection?: boolean;
  rpcReq: RequestArguments;
};

export type TRpcFlowContext = {
  request: TProviderRequest;
};

const taskFlow = new AsyncTaskFlow<TRpcFlowContext>();

const composedTasks = taskFlow
  .use(checkMethodExist)
  .use(eip5792Calls)
  .use(requestConnect)
  .use(requestChain)
  .use(requestSignature)
  .use(sendTx)
  .use(callProvider)
  .compose();

export default (request: TProviderRequest) =>
  composedTasks({ request }).finally(() => {
    console.log(request.rpcReq.method, 'finished', request.rpcReq.params);
  });
