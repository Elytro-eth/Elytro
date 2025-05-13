import { approvalService, ApprovalTypeEn } from '@/background/services/approval';
import connectionManager from '@/background/services/connection';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import { ethErrors } from 'eth-rpc-errors';

const CONNECT_METHODS: ProviderMethodType[] = ['eth_requestAccounts', 'eth_accounts'];

const CONNECT_METHODS_WITH_PERMISSIONS: ProviderMethodType[] = ['wallet_requestPermissions'];

const GET_CONNECTION_INFO_METHODS: ProviderMethodType[] = ['wallet_getPermissions'];

const DISCONNECT_METHODS: ProviderMethodType[] = ['wallet_revokePermissions'];

const connectingSites = new Set<string>();

export const requestConnect: TFlowMiddleWareFn = async (ctx, next) => {
  const {
    rpcReq: { method },
    dApp,
  } = ctx.request;

  // if the method is to get connection info, return the permissions
  if (GET_CONNECTION_INFO_METHODS.includes(method)) {
    return connectionManager.getPermissions(dApp.origin);
  }

  if (ctx.request.needConnection && connectionManager.isConnected(dApp.origin)) {
    return next();
  }

  // if the method is to connect, request connection
  if (CONNECT_METHODS.includes(method) || CONNECT_METHODS_WITH_PERMISSIONS.includes(method)) {
    if (connectingSites.has(dApp.origin)) {
      throw ethErrors.rpc.resourceNotFound('Elytro:Multiple connect requests are not allowed. Please wait.');
    }

    if (connectionManager.isConnected(dApp.origin)) {
      return CONNECT_METHODS_WITH_PERMISSIONS.includes(method) ? connectionManager.getPermissions(dApp.origin) : next();
    }

    try {
      connectingSites.add(dApp.origin);
      await approvalService.request(ApprovalTypeEn.Connect, {
        dApp,
      });

      // Only wallet_requestPermissions needs to return the permissions, else leave it to the next middleware
      if (method === 'wallet_requestPermissions') {
        return connectionManager.getPermissions(dApp.origin);
      }
    } catch (error) {
      return error || ethErrors.provider.userRejectedRequest();
    } finally {
      connectingSites.delete(dApp.origin);
    }
  } else if (DISCONNECT_METHODS.includes(method)) {
    return connectionManager.disconnect(dApp.origin);
  }

  return next();
};
