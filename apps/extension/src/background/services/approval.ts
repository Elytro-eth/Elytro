import { ApprovalTypeEn } from '@/constants/operations';
import {
  openPopupWindow,
  tryRemoveWindow,
  ApprovalWindowEventNameEn,
  approvalWindowEvent,
} from '@/utils/window';
import { ethErrors } from 'eth-rpc-errors';
import { v4 as UUIDv4 } from 'uuid';

const APPROVAL_TYPE_ROUTE_MAP: Record<ApprovalTypeEn, string> = {
  [ApprovalTypeEn.Unlock]: 'unlock',
  [ApprovalTypeEn.Connect]: 'connect',
  [ApprovalTypeEn.SendTx]: 'tx-confirm',
  [ApprovalTypeEn.Alert]: 'alert',
  [ApprovalTypeEn.Sign]: 'sign',
  [ApprovalTypeEn.ChainChange]: 'chain-change',
};

class ApprovalService {
  private _currentApproval: Nullable<TApprovalInfo> = null;
  private _approvals: Map<number, TApprovalInfo> = new Map();

  constructor() {
    approvalWindowEvent.on(ApprovalWindowEventNameEn.Removed, (winId) => {
      this._rejectApprovalByWinId(winId);
    });
  }

  get currentApproval() {
    return this._currentApproval;
  }

  public async request(type: ApprovalTypeEn, data?: TApprovalData) {
    if (this._currentApproval) {
      throw ethErrors.provider.userRejectedRequest();
    }

    return new Promise((resolve, reject) => {
      // compose approval info
      const approval = {
        type,
        id: UUIDv4(),
        data,
        resolve: (data: unknown) => {
          resolve(data);
        },
        reject: (data: unknown) => {
          reject(data);
        },
      };

      // open approval window. DO NOT use async/await here, because it's a promise
      this._openApprovalWindow(APPROVAL_TYPE_ROUTE_MAP[type]).then(
        (approvalWindowId) => {
          if (!approvalWindowId) {
            reject(
              ethErrors.provider.custom({
                code: 4001,
                message: 'Approval window not opened',
              })
            );
          } else {
            this._currentApproval = {
              ...approval,
              winId: approvalWindowId,
            };
            this._approvals.set(approvalWindowId, this._currentApproval);

            // eventBus.emit(EVENT_TYPES.APPROVAL.REQUESTED, approval.id);
          }
        }
      );
    });
  }

  private _openApprovalWindow = async (path: string) => {
    return (await openPopupWindow(path)) || null;
  };

  private _clearApproval = () => {
    if (this._currentApproval) {
      // set a timeout to avoid propose a new approval too soon
      setTimeout(() => {
        this._currentApproval = null;
      }, 200);
    }
  };

  private _rejectApprovalByWinId = (winId?: number) => {
    if (!winId || !this._approvals.has(winId)) {
      return;
    }

    if (this._currentApproval?.winId === winId) {
      this._clearApproval();

      const approval = this._approvals.get(winId);
      approval?.reject(ethErrors.provider.userRejectedRequest());
      this._approvals.delete(winId);

      tryRemoveWindow(winId);
    }
  };

  public resolveApproval = (id: string, data: unknown) => {
    if (id !== this._currentApproval?.id) {
      return;
    }
    this._currentApproval?.resolve(data);

    // go to success page. no need to remove window for now.
    // tryRemoveWindow(this._currentApproval?.winId);

    this._clearApproval();
  };

  public rejectApproval = (id: string) => {
    if (id !== this._currentApproval?.id) {
      return;
    }

    this._rejectApprovalByWinId(this._currentApproval?.winId);
  };
}

const approvalService = new ApprovalService();

export { approvalService, ApprovalTypeEn };
