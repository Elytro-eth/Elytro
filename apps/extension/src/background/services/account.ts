import { elytroSDK } from './sdk';
import { EVENT_TYPES } from '@/constants/events';
import eventBus from '@/utils/eventBus';
import { localStorage } from '@/utils/storage/local';
import LocalSubscribableStore from '@/utils/store/LocalSubscribableStore';

type TAccountsState = {
  accounts: TAccountInfo[];
  currentAccount: TAccountInfo | null;
};

const ACCOUNTS_STORAGE_KEY = 'elytroAccounts';
const RECOVERY_RECORD_STORAGE_KEY = 'elytroRecoveryRecord';

class AccountManager {
  private _store: LocalSubscribableStore<TAccountsState>;

  constructor() {
    this._store = new LocalSubscribableStore<TAccountsState>(ACCOUNTS_STORAGE_KEY, (initState) => {
      if (initState?.currentAccount) {
        eventBus.emit(EVENT_TYPES.ACCOUNT.ACCOUNT_INITIALIZED, initState.currentAccount);
      }
    });
  }

  // ! DO NOT USE Array.push() to add new account, use this._accounts = [...this._accounts, account] instead
  private get _accounts() {
    return this._store.state.accounts || [];
  }

  private set _accounts(accounts: TAccountInfo[]) {
    this._store.state.accounts = accounts;
  }

  private get _currentAccount() {
    return this._store.state.currentAccount;
  }

  private set _currentAccount(currentAccount: TAccountInfo | null) {
    this._store.state.currentAccount = currentAccount;
  }

  // TODO: maybe make _accounts public?
  get accounts() {
    return this._accounts;
  }

  get currentAccount() {
    return this._currentAccount;
  }

  public importAccounts(accounts: TAccountInfo[]) {
    if (!accounts || accounts.length === 0) {
      throw new Error('Elytro::AccountManager::importAccounts: no accounts to import');
    }

    this._accounts = accounts;
    this._currentAccount = this._accounts[0];
  }

  public async getRecoveryRecord() {
    return (await localStorage.get<TRecoveryRecord>(RECOVERY_RECORD_STORAGE_KEY)) || null;
  }

  public async updateRecoveryRecord(recoveryRecord: TRecoveryRecord | null) {
    await localStorage.save({ [RECOVERY_RECORD_STORAGE_KEY]: recoveryRecord });
  }

  public getAccountsByChainId(chainId: number | string) {
    return this._accounts.filter((account) => account.chainId === Number(chainId));
  }

  public getAccountsByOwner(owner: string) {
    return this._accounts.filter((account) => account.owner === owner);
  }

  public getAccountByOwnerAndChainId(owner: string, chainId: number | string) {
    return this._accounts.find((account) => account.owner === owner && account.chainId === Number(chainId));
  }

  public async createAccountAsCurrent(eoaAddress: string, chainId: number) {
    const account = this.getAccountByOwnerAndChainId(eoaAddress, chainId);

    if (account) {
      console.log('Elytro::AccountManager::createAccount: wallet already exists');
      // return account;
      return;
    }

    try {
      // creating address is not a sdk chain related request, so we don't rely on switch chain
      const { address: newAccountAddress, owner: ownerAddress } = await elytroSDK.createWalletAddress(
        eoaAddress,
        chainId
      );

      const newAccount = {
        address: newAccountAddress,
        chainId,
        hasRecoveryContacts: false,
        owner: ownerAddress,
      } as unknown as TAccountInfo;

      // ! push method will not trigger state update, so we need to reset the array
      this._accounts = [...this._accounts, newAccount];
      this._currentAccount = newAccount;
    } catch (error) {
      console.error(error);
    }
  }

  public async switchAccountByChainId(chainId: number) {
    // TODO: check if this is the correct way to get the account
    const account = this.getAccountsByChainId(chainId)?.[0];

    if (!account) {
      throw new Error('Elytro::AccountManager::switchAccountByChainId: wallet not found');
    }

    this._currentAccount = account;
  }

  public async resetAccounts() {
    this._accounts = [];
    this._currentAccount = null;
  }

  public async removeAccountByAddress(address: string) {
    this._accounts = this._accounts.filter((account) => account.address !== address);
  }

  // TODO: check this logic. is it really needed?
  public async setCurrentAccount(account: TAccountInfo) {
    this._currentAccount = account;

    if (!this._accounts.find((acc) => acc.address === account.address)) {
      this._accounts = [...this._accounts, account];
    }
  }

  public async updateCurrentAccountInfo(account: Partial<TAccountInfo>) {
    if (!this._currentAccount) return;

    const updatedAccount = {
      ...this._currentAccount,
      ...account,
    };

    this._accounts = this._accounts.map((acc) => (acc.address === updatedAccount.address ? updatedAccount : acc));

    this._currentAccount = updatedAccount;
  }
}

const accountManager = new AccountManager();
export default accountManager;
