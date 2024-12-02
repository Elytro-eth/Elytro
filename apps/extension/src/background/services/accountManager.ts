import { SubscribableStore } from '@/utils/store/subscribableStore';
import { localStorage } from '@/utils/storage/local';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';
import { elytroSDK } from './sdk';
import keyring from './keyring';
import networkService from './networks';

export interface Account {
  address: string;
  networkId: string | number;
  isActivated: boolean;
}

interface AccountState {
  accounts: { [key: string]: Account } | null;
}

const ACCOUNTS_STORAGE_KEY = 'elytroAccountsState';

class AccountManager {
  private _accounts: Map<string, Account> = new Map();
  private _accountStore: SubscribableStore<AccountState>;
  isInitialized: boolean = false;

  constructor() {
    this._accountStore = new SubscribableStore<AccountState>({
      accounts: {},
    });
    // localStorage.remove([ACCOUNTS_STORAGE_KEY])
    this._accountStore.subscribe((state) => {
      localStorage.save({ [ACCOUNTS_STORAGE_KEY]: state });
      eventBus.emit(EVENT_TYPES.ACCOUNT.ITEMS_UPDATED);
    });
    this._initialize();
  }

  private async _initialize() {
    const { [ACCOUNTS_STORAGE_KEY]: prevState } = await localStorage.get([
      ACCOUNTS_STORAGE_KEY,
    ]);
    if (prevState) {
      const state = prevState as AccountState;
      const acs = Object.entries(state.accounts as { [key: string]: Account });
      this._accountStore.setState(state);
      this._accounts = new Map(acs);
    }
  }

  get accounts() {
    return this._accounts;
  }

  public async createNewSmartAccount(networkId?: number) {
    try {
      let smartAccounAdress = '';
      if (networkId) {
        smartAccounAdress = await elytroSDK.createWalletAddress(
          keyring.owner?.address as string,
          networkId
        );
      } else {
        smartAccounAdress = await elytroSDK.createWalletAddress(
          keyring.owner?.address as string
        );
      }

      const account: Account = {
        address: smartAccounAdress,
        networkId: networkId || networkService.currentChain.id,
        isActivated: false,
      };
      this._accounts.set(account.networkId.toString(), account);
      this._accountStore.setState({
        accounts: Object.fromEntries(this._accounts),
      });
    } catch (error) {
      console.error(error);
      throw new Error('Failed to create new smart account');
    }
  }

  public getAccount(networkId: string | number) {
    return this._accounts.get(networkId.toString());
  }

  public updateAccount(account: Account) {
    this._accounts.set(account.networkId.toString(), account);
    this._accountStore.setState({
      accounts: Object.fromEntries(this._accounts),
    });
  }
}

const accountManager = new AccountManager();
export default accountManager;
