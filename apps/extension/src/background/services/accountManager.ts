import { SubscribableStore } from '@/utils/store/subscribableStore';
import { localStorage } from '@/utils/storage/local';
import { elytroSDK } from './sdk';
import keyring from './keyring';
import networkService from './networks';

export interface Account {
  ownerAddress: string;
  address: string;
  networkId: string | number;
  isActivated: boolean;
}

interface AccountState {
  currentAccount: Account | null;
  accounts: { [key: string]: Account } | null;
}

const ACCOUNTS_STORAGE_KEY = 'elytroAccountsState';

class AccountManager {
  private _accounts: Map<string, Account> = new Map();
  private _accountStore: SubscribableStore<AccountState>;
  private _currentAccount: Account | null = null;
  isInitialized: boolean = false;

  constructor() {
    this._accountStore = new SubscribableStore<AccountState>({
      currentAccount: null,
      accounts: {},
    });
    // localStorage.remove([ACCOUNTS_STORAGE_KEY])
    this._accountStore.subscribe((state) => {
      localStorage.save({ [ACCOUNTS_STORAGE_KEY]: state });
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
      this._currentAccount = state.currentAccount;
    }
  }

  get currentAccount() {
    return this._currentAccount;
  }

  get accounts() {
    return this._accounts;
  }

  private _saveStore() {
    this._accountStore.setState({
      currentAccount: this._currentAccount,
      accounts: Object.fromEntries(this._accounts),
    });
  }

  public async createNewSmartAccount(networkId?: number, setAsCurrent = false) {
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
        ownerAddress: keyring.owner?.address as string,
        address: smartAccounAdress,
        networkId: networkId || networkService.currentChain.id,
        isActivated: false,
      };
      this._accounts.set(account.networkId.toString(), account);
      if (setAsCurrent) {
        this._currentAccount = account;
      }
      this._saveStore();
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
    this._saveStore();
  }

  public switchAccout(address: string) {
    const account = this._accounts.get(address);
    if (account) {
      this._currentAccount = account;
      this._saveStore();
      return this._currentAccount;
    }
    return null;
  }
}

const accountManager = new AccountManager();
export default accountManager;
