import { SubscribableStore } from '@/utils/store/subscribableStore';
import { localStorage } from '@/utils/storage/local';
import { elytroSDK } from './sdk';
import keyring from './keyring';
import networkService from './networks';

interface AccountState {
  currentAccount: Account | null;
  accounts: { [key: string]: Account } | null;
}

const ACCOUNTS_STORAGE_KEY = 'elytroAccountsState';

class AccountManager {
  private _accounts: Map<string, Account> = new Map();
  private _accountStore: SubscribableStore<AccountState>;
  private _currentAccount: Account | null = null;

  constructor() {
    this._accountStore = new SubscribableStore<AccountState>({
      currentAccount: null,
      accounts: {},
    });

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
      const smartAccountAddress = await elytroSDK.createWalletAddress(
        keyring.owner?.address as string,
        networkId
      );

      const account: Account = {
        ownerAddress: keyring.owner?.address as string,
        address: smartAccountAddress,
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
    const isCurrentAccount =
      this._currentAccount?.networkId === account.networkId;
    this._accounts.set(account.networkId.toString(), account);
    if (isCurrentAccount) {
      this._currentAccount = account;
    }
    this._saveStore();
  }

  public switchAccount(address: string) {
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
