import { SubscribableStore } from '@/utils/store/SubscribableStore';
import HistoryItem from './historyItem';
import UniqueQueue from '@/utils/UniqueQueue';
import { UserOperationHistory } from '@/constants/operations';
import { localStorage } from '@/utils/storage/local';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

const HISTORY_STORAGE_KEY = 'elytroHistory';

type HistoryState = {
  [key: string]: UserOperationHistory;
};

class HistoryManager {
  private _historyQueue: UniqueQueue<HistoryItem>;
  private _store: SubscribableStore<HistoryState>;
  private _currentAccount: TAccountInfo | null = null;

  constructor() {
    this._historyQueue = new UniqueQueue<HistoryItem>();
    this._store = new SubscribableStore({} as HistoryState);
    this._initialize();

    eventBus.on(EVENT_TYPES.ACCOUNT.ACCOUNT_INITIALIZED, (account) => {
      this.switchAccount(account);
    });

    eventBus.on(EVENT_TYPES.HISTORY.ITEM_STATUS_UPDATED, (opHash, status) => {
      const historyItem = this.find(opHash);
      if (historyItem) {
        this._store.setState({
          ...this._store.state,
          [opHash]: {
            ...this._store.state[opHash],
            status,
          },
        });
      }
    });
  }

  private get _storageKey() {
    return `${HISTORY_STORAGE_KEY}-${this._currentAccount?.chainId}-${this._currentAccount?.address}`;
  }

  get isInitialized() {
    return !!this._currentAccount;
  }

  get histories() {
    return this._historyQueue.items;
  }

  private _storeSubscriber = (state: HistoryState) => {
    localStorage.save({ [this._storageKey]: state });

    eventBus.emit(EVENT_TYPES.HISTORY.ITEMS_UPDATED);
  };

  private _initialize = async () => {
    if (!this._currentAccount) {
      return;
    }

    // update local storage when _store changes
    this._store.subscribe(this._storeSubscriber);

    const prevState = (await localStorage.get(
      this._storageKey
    )) as HistoryState;

    // sync local storage with _store
    if (prevState) {
      this._store.setState(prevState as HistoryState);

      Object.entries(prevState as HistoryState).forEach(([_, data]) => {
        this._historyQueue.enqueue(new HistoryItem(data));
      });
    }
  };

  public switchAccount(account: TAccountInfo | null) {
    if (
      account?.address &&
      account?.address === this._currentAccount?.address
    ) {
      return;
    }

    this._currentAccount = account;
    this._store.resetState();
    this._historyQueue.clear();

    this._initialize();
  }

  add(data: UserOperationHistory) {
    if (this.find(data.opHash)) {
      console.log('duplicate history', data.opHash);
      return;
    }

    const newHistory = new HistoryItem(data);
    this._historyQueue.enqueue(newHistory);

    this._store.setState({
      [data.opHash]: newHistory.data,
    });
  }

  find(opHash: string) {
    return this._historyQueue.find((item) => item.opHash === opHash);
  }

  remove(opHash: string) {
    this._historyQueue.dequeueByFn((item) => item.opHash === opHash);
    this._store.setState({
      ...this._store.state,
      [opHash]: undefined,
    });
  }
}

const historyManager = new HistoryManager();

export default historyManager;
