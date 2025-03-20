import {
  UserOperationHistory,
  UserOperationStatusEn,
} from '@/constants/operations';
import { elytroSDK } from '../sdk';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

const FETCH_INTERVAL = 1_000;

const STATUS_MAP = {
  '0x1': UserOperationStatusEn.confirmedSuccess,
  '0x0': UserOperationStatusEn.confirmedFailed,
};

class HistoryItem {
  private _data: UserOperationHistory;
  private _watcher: ReturnType<typeof setInterval> | null = null;
  private _status: UserOperationStatusEn = UserOperationStatusEn.pending;
  private _fetching: boolean = false;

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

  private _updateStatus(status: UserOperationStatusEn) {
    if (this._status === status) {
      return;
    }

    if (status !== UserOperationStatusEn.pending && this._watcher) {
      clearInterval(this._watcher);
      this._watcher = null;
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

  async fetchStatus() {
    if (this._fetching) {
      return;
    }

    try {
      this._fetching = true;
      const res = await elytroSDK.getUserOperationReceipt(this._data.opHash);
      const newStatus =
        // the definition is not correct. res has 'status' field
        STATUS_MAP[(res as SafeAny)?.status as keyof typeof STATUS_MAP] ||
        UserOperationStatusEn.pending;
      this._updateStatus(newStatus);
    } catch (error) {
      console.error(error);
    } finally {
      this._fetching = false;
    }
  }
}

export default HistoryItem;
