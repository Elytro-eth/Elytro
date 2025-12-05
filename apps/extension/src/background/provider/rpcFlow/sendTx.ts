import { approvalService, ApprovalTypeEn } from '@/background/services/approval';
import type { TFlowMiddleWareFn } from '@/utils/asyncTaskFlow';
import { walletController } from '@/background/walletController';
import { HistoricalActivityTypeEn } from '@/constants/operations';
import { v4 as UUIDv4 } from 'uuid';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

const SEND_TX_METHODS: ProviderMethodType[] = ['eth_sendTransaction'];

export const sendTx: TFlowMiddleWareFn = async (ctx, next) => {
  const {
    rpcReq: { method, params },
    dApp,
  } = ctx.request;

  if (SEND_TX_METHODS.includes(method)) {
    const origin = dApp?.origin || '';
    let isTrusted = false;

    try {
      isTrusted = await walletController.isFastSigningTrustedDapp(origin);
    } catch (error) {
      console.error('Failed to check fast signing trust:', error);
    }
    if (isTrusted) {
      console.log(`[Fast Signing] Silently signing transaction from trusted dApp: ${origin}`);

      return new Promise((resolve, reject) => {
        (async () => {
          try {
            const silentSigningId = UUIDv4();

            const currentAccount = await walletController.getCurrentAccount();
            if (!currentAccount) {
              throw new Error('No current account');
            }

            // Decode the transaction to get details for history
            const currentUserOp = await walletController.createTxUserOp(params);
            const decodedDetail = await walletController.decodeUserOp(currentUserOp);

            const result = await walletController.buildAndSendUserOp(
              params,
              { type: 'sponsor' },
              true // Bypass 2FA hook if it's enabled
            );

            const opHash = result as string;
            console.log(`[Fast Signing] Transaction sent silently, opHash: ${opHash}`);

            walletController.addNewHistory({
              type: decodedDetail?.[0]?.method
                ? HistoricalActivityTypeEn.ContractInteract
                : HistoricalActivityTypeEn.Send,
              opHash,
              from: currentAccount.address,
              decodedDetail,
              approvalId: silentSigningId, // Pass the ID so historyItem can emit event
            });

            eventBus.once(
              `${EVENT_TYPES.HISTORY.TX_HASH_RECEIVED}_${silentSigningId}`,
              ({ txHash }: { txHash: string }) => {
                resolve(txHash);
              }
            );

            // This allows historyItem to emit TX_HASH_RECEIVED event with this ID
          } catch (error) {
            reject(error);
          }
        })();
      }).catch(async (error) => {
        console.error('[Fast Signing] Silent signing failed, falling back to normal approval:', error);
        // Fall back to normal approval on any error
        return await approvalService.request(ApprovalTypeEn.TxConfirm, {
          dApp,
          tx: params,
        });
      });
    }

    // Normal approval flow for non-trusted dApps
    return await approvalService.request(ApprovalTypeEn.TxConfirm, {
      dApp,
      tx: params,
    });
  }

  return next();
};
