import { EVENT_TYPES } from '@/constants/events';
import { ApprovalTypeEn } from '@/constants/operations';
import { RuntimeMessage } from '@/utils/message';
import { ethErrors } from 'eth-rpc-errors';
import { v4 as UUIDv4 } from 'uuid';

class ApprovalService {
  private _currentApproval: Nullable<TApprovalInfo> = null;

  get currentApproval() {
    return this._currentApproval;
  }

  public async request(type: ApprovalTypeEn, data?: TApprovalData) {
    if (this._currentApproval) {
      throw ethErrors.provider.userRejectedRequest();
    }

    return new Promise((resolve, reject) => {
      // compose approval info
      this._currentApproval = {
        type,
        id: UUIDv4(),
        data,
        resolve: (data: unknown) => {
          return resolve(data);
        },
        reject: (reason?: Error) => {
          return reject(reason || ethErrors.provider.userRejectedRequest());
        },
      };

      RuntimeMessage.sendMessage(EVENT_TYPES.APPROVAL.REQUESTED);
    });
  }

  private _clearApproval = () => {
    // if (this._currentApproval) {
    //   setTimeout(() => {
    //     this._currentApproval = null;
    //   }, 200);
    // }
    this._currentApproval = null;
  };

  public resolveApproval = (id: string, data: unknown) => {
    if (id !== this._currentApproval?.id) {
      return;
    }
    this._currentApproval?.resolve(data);
    this._clearApproval();
  };

  public rejectApproval = (id: string, reason?: Error) => {
    if (id !== this._currentApproval?.id) {
      return;
    }
    this._currentApproval?.reject(reason);
    this._clearApproval();
  };
}

const approvalService = new ApprovalService();

export { approvalService, ApprovalTypeEn };
