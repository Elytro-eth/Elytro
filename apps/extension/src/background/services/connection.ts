import { localStorage } from '@/utils/storage/local';
import { SubscribableStore } from '@/utils/store/subscribableStore';
import sessionManager from './session';

type TConnectedDAppInfo = TDAppInfo & {
  chainId: number;
  isConnected: boolean;
  permissions: WalletPermission[];
};

type TConnectionManagerState = {
  sites: TConnectedDAppInfo[];
};

const CONNECTION_STORAGE_KEY = 'elytroConnectionState';

/**
 * Manage connected sites
 * Support EIP-2255
 */
class ConnectionManager {
  private connectedSites: Map<string, TConnectedDAppInfo> = new Map(); // Store connected sites
  private _store: SubscribableStore<TConnectionManagerState>;
  private _initialized = false;

  constructor() {
    this._store = new SubscribableStore({
      sites: [] as TConnectedDAppInfo[],
    });

    this._store.subscribe((state) => {
      localStorage.save({ [CONNECTION_STORAGE_KEY]: state });
    });
  }

  public async restore() {
    if (!this._initialized) {
      await this._initFromStorage();
    }
  }

  private async _initFromStorage() {
    const { [CONNECTION_STORAGE_KEY]: prevState } = (await localStorage.get([
      CONNECTION_STORAGE_KEY,
    ])) as { [CONNECTION_STORAGE_KEY]: TConnectionManagerState };

    if (prevState?.sites) {
      this._store.setState(prevState);

      prevState.sites.forEach((site) => {
        if (site.origin) {
          this.connectedSites.set(site.origin, site);
        }
      });
    }

    this._initialized = true;
  }

  public connect(dApp: TDAppInfo, chainId: number) {
    if (!dApp.origin) {
      return;
    }

    this.addConnectedSite({
      ...dApp,
      isConnected: true,
      chainId,
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
    this.connectedSites.delete(String(origin));
    this.syncToStorage();
    sessionManager.broadcastMessageToDApp(origin, 'accountsChanged', []);
  }

  public getSite(origin: string) {
    return this.connectedSites.get(String(origin));
  }

  public setSite(origin: string, info: TConnectedDAppInfo) {
    this.connectedSites.set(String(origin), info);
    this.syncToStorage();
  }

  public addConnectedSite({ origin, ...rest }: TConnectedDAppInfo) {
    this.connectedSites.set(origin!, { ...rest, origin });
    this.syncToStorage();
  }

  // maybe turn isConnected to false a while later
  public updateConnectSite(
    origin: string,
    updates: Omit<TConnectedDAppInfo, 'origin'>
  ) {
    const siteInfo = this.connectedSites.get(origin);

    if (siteInfo) {
      this.connectedSites.set(origin, { ...siteInfo, ...updates });
      this.syncToStorage();
    }
  }

  public isConnected(origin: string): boolean {
    return this.connectedSites.get(origin)?.isConnected || false;
  }

  public getPermissions(origin: string): WalletPermission[] {
    return this.connectedSites.get(origin)?.permissions || [];
  }

  public requestPermissions(
    origin: string,
    permissions: WalletPermission[]
  ): boolean {
    const site = this.connectedSites.get(origin);
    if (!site) return false;

    site.permissions = [...new Set([...site.permissions, ...permissions])];
    this.syncToStorage();
    return true;
  }

  public revokePermissions(
    origin: string,
    permissions: WalletPermission[]
  ): void {
    const site = this.connectedSites.get(origin);
    if (!site) return;

    site.permissions = site.permissions.filter(
      ({ parentCapability }) =>
        !permissions.some((p) => p.parentCapability === parentCapability)
    );
    this.syncToStorage();
  }

  private syncToStorage() {
    this._store.setState({
      sites: [...this.connectedSites.values()],
    });
  }
}

const connectionManager = new ConnectionManager();

export default connectionManager;
