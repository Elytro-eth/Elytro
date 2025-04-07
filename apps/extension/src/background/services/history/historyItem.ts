import {
  UserOperationHistory,
  UserOperationStatusEn,
} from '@/constants/operations';
import { elytroSDK } from '../sdk';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

const FETCH_INTERVAL = 1_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1_000;

class HistoryItem {
  private _data: UserOperationHistory;
  private _watcher: ReturnType<typeof setInterval> | null = null;
  private _status: UserOperationStatusEn = UserOperationStatusEn.pending;
  private _fetching: boolean = false;
  private _retryCount: number = 0;
  private _backoffTime: number = INITIAL_BACKOFF;

  constructor(data: UserOperationHistory) {
    this._status = data?.status || UserOperationStatusEn.pending;
    this._data = {
      ...data,
    };
    this._initWatcher();
  }

  get data() {
    return {
      ...this._data,
      status: this._status,
    };
  }

  get opHash() {
    return this._data.opHash;
  }

  get status() {
    return this._status;
  }

  destroy() {
    if (this._watcher) {
      clearInterval(this._watcher);
      this._watcher = null;
    }
  }

  private _updateStatus(status: UserOperationStatusEn) {
    if (this._status === status) {
      return;
    }

    if (status !== UserOperationStatusEn.pending && this._watcher) {
      clearInterval(this._watcher);
      this._watcher = null;
    } else if (status === UserOperationStatusEn.pending && !this._watcher) {
      this._initWatcher();
    }

    this._status = status;
    this._broadcastStatusChange();
  }

  private _broadcastStatusChange() {
    eventBus.emit(
      EVENT_TYPES.HISTORY.ITEM_STATUS_UPDATED,
      this._data.opHash,
      this.status
    );
  }

  private _initWatcher() {
    if (!this._watcher && this._status === UserOperationStatusEn.pending) {
      this._watcher = setInterval(() => this.fetchStatus(), FETCH_INTERVAL);
    }
  }

  private _handleError(error: Error) {
    console.error(error);

    if (this._retryCount < MAX_RETRIES) {
      this._retryCount++;
      this._backoffTime *= 2; // Exponential backoff

      if (this._watcher) {
        clearInterval(this._watcher);
      }
      this._watcher = setInterval(() => this.fetchStatus(), this._backoffTime);
    } else {
      this._updateStatus(UserOperationStatusEn.confirmedFailed);
      this.destroy();
    }
  }

  async fetchStatus() {
    if (this._fetching) {
      return;
    }

    try {
      this._fetching = true;
      const res = await elytroSDK.getUserOperationReceipt(this._data.opHash);
      let newStatus = UserOperationStatusEn.pending;

      // status is 0x1 means has confirm result
      if (res && (res as SafeAny)?.status === '0x1') {
        newStatus = res.success
          ? UserOperationStatusEn.confirmedSuccess
          : UserOperationStatusEn.confirmedFailed;
      }
      // Reset retry state on success
      this._retryCount = 0;
      this._backoffTime = INITIAL_BACKOFF;

      this._updateStatus(newStatus);
    } catch (error) {
      this._handleError(error as Error);
    } finally {
      this._fetching = false;
    }
  }
}

export default HistoryItem;
