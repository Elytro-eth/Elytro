import sessionManager from './session';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';
import { SubscribableStore } from '@/utils/store/SubscribableStore';
import { localStorage } from '@/utils/storage/local';

type TConnectionManagerState = {
  [key: string]: TConnectedDAppInfo[];
};

const CONNECTION_STORAGE_KEY = 'elytroConnectionState';

/**
 * Manage connected sites
 * Support EIP-2255
 */
class ConnectionManager {
  private _connectedSites: Map<string, TConnectedDAppInfo> = new Map(); // Store connected sites
  private _store: SubscribableStore<TConnectionManagerState>;
  private _accountKey: string | null = null;

  constructor() {
    this._store = new SubscribableStore<TConnectionManagerState>({});

    this._store.subscribe((state) => {
      localStorage.save({ [CONNECTION_STORAGE_KEY]: state });
    });

    eventBus.on(EVENT_TYPES.ACCOUNT.ACCOUNT_INITIALIZED, (account) => {
      this.switchAccount(account);
    });
  }

  public async switchAccount(account: TAccountInfo | null) {
    if (!account || !account.address || !account.chainId) {
      console.log(
        'Elytro::ConnectionManager:: switchAccount failed, no wallet.'
      );
      return;
    }

    this._accountKey = `${account.address}-${account.chainId}`;
    this._connectedSites.clear();

    const prevAccountState =
      (
        (await localStorage.get(
          CONNECTION_STORAGE_KEY
        )) as TConnectionManagerState
      )?.[this._accountKey] || [];

    prevAccountState?.forEach((site: TConnectedDAppInfo) => {
      if (site.origin) {
        this._connectedSites.set(site.origin, site);
      }
    });
  }

  public connect(dApp: TDAppInfo) {
    if (!dApp.origin) {
      return;
    }

    this.addConnectedSite({
      ...dApp,
      isConnected: true,
      permissions: [
        {
          parentCapability: 'eth_accounts',
          date: Date.now(),
          invoker: dApp.origin,
        },
      ],
    });
  }

  public disconnect(origin: string) {
    this._connectedSites.delete(String(origin));
    this._syncToStorage();
    sessionManager.broadcastMessageToDApp(origin, 'accountsChanged', []);
  }
  public getSite(origin: string) {
    return this._connectedSites.get(String(origin));
  }

  public setSite(origin: string, info: TConnectedDAppInfo) {
    this._connectedSites.set(String(origin), info);
    this._syncToStorage();
  }

  public addConnectedSite({ origin, ...rest }: TConnectedDAppInfo) {
    this._connectedSites.set(origin!, { ...rest, origin });
    this._syncToStorage();
  }

  // maybe turn isConnected to false a while later
  public updateConnectSite(
    origin: string,
    updates: Omit<TConnectedDAppInfo, 'origin'>
  ) {
    const siteInfo = this._connectedSites.get(origin);

    if (siteInfo) {
      this._connectedSites.set(origin, { ...siteInfo, ...updates });
      this._syncToStorage();
    }
  }

  public isConnected(origin: string): boolean {
    return this._connectedSites.get(origin)?.isConnected || false;
  }

  public getPermissions(origin: string): WalletPermission[] {
    return this._connectedSites.get(origin)?.permissions || [];
  }

  public requestPermissions(
    origin: string,
    permissions: WalletPermission[]
  ): boolean {
    const site = this._connectedSites.get(origin);
    if (!site) return false;

    site.permissions = [...site.permissions, ...permissions];
    this._syncToStorage();
    return true;
  }

  public revokePermissions(
    origin: string,
    permissions: WalletPermission[]
  ): void {
    const site = this._connectedSites.get(origin);
    if (!site) return;

    site.permissions = site.permissions.filter(
      ({ parentCapability }) =>
        !permissions.some((p) => p.parentCapability === parentCapability)
    );
    this._syncToStorage();
  }

  private _syncToStorage() {
    if (this._accountKey) {
      this._store.setState({
        [this._accountKey]: this.connectedSites,
      });
    }
  }

  public get connectedSites() {
    return Array.from(this._connectedSites.values());
  }
}

const connectionManager = new ConnectionManager();

export default connectionManager;
