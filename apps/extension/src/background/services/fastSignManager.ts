import { FAST_SIGNING_DAPPS } from '@/constants/dapps';
import LocalSubscribableStore from '@/utils/store/LocalSubscribableStore';

// Trusted dApp type
type TrustedDapp = {
  name: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
};

// Fast Sign Settings state
type FastSignState = {
  enabled: boolean;
  expiryDate: string | null;
  trustedDapps: TrustedDapp[];
};

// Fast Sign Settings type (public API)
export type FastSignSettings = FastSignState;

const FAST_SIGN_STORAGE_KEY = 'elytroFastSignSettings';

type GetCurrentAccountFn = () => { address: string; chainId: number } | null;

/**
 * Fast Sign Manager Service
 * Manages fast signing feature settings and trusted dApps list using LocalSubscribableStore
 */
class FastSignManagerService {
  private _store: LocalSubscribableStore<Record<string, FastSignState>>;
  private getCurrentAccount: GetCurrentAccountFn;

  constructor(getCurrentAccount: GetCurrentAccountFn) {
    this.getCurrentAccount = getCurrentAccount;
    this._store = new LocalSubscribableStore<Record<string, FastSignState>>(FAST_SIGN_STORAGE_KEY);
  }

  /**
   * Get storage key for current account
   */
  private _getAccountKey(): string | null {
    const currentAccount = this.getCurrentAccount();
    if (!currentAccount?.address || !currentAccount?.chainId) {
      return null;
    }
    return `${currentAccount.address}_${currentAccount.chainId}`;
  }

  /**
   * Get default settings
   */
  private _getDefaultSettings(): FastSignState {
    return {
      enabled: false,
      expiryDate: null,
      trustedDapps: FAST_SIGNING_DAPPS.map((dapp) => ({
        ...dapp,
        enabled: false,
      })),
    };
  }

  /**
   * Calculate expiry date (current time + 3 days)
   */
  private _calculateExpiryDate(): string {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
    return expiryDate.toISOString();
  }

  /**
   * Check and handle expiry
   */
  private _checkAndHandleExpiry(settings: FastSignState): FastSignState {
    if (settings.expiryDate && new Date(settings.expiryDate) < new Date()) {
      // Auto-disable if expired
      return {
        ...settings,
        enabled: false,
        expiryDate: null,
      };
    }
    return settings;
  }

  /**
   * Get current settings for current account
   */
  public async getSettings(): Promise<FastSignSettings> {
    const accountKey = this._getAccountKey();
    if (!accountKey) {
      return this._getDefaultSettings();
    }

    const accountSettings = this._store.state[accountKey];
    if (!accountSettings) {
      return this._getDefaultSettings();
    }

    // Check expiry and auto-disable if needed
    const checkedSettings = this._checkAndHandleExpiry(accountSettings);
    if (checkedSettings !== accountSettings) {
      // Save the updated settings if expiry triggered
      this._store.state[accountKey] = checkedSettings;
    }

    return checkedSettings;
  }

  /**
   * Enable or disable fast signing
   * When enabling, automatically sets expiry date to current time + 3 days
   */
  public async setEnabled(enabled: boolean): Promise<void> {
    const accountKey = this._getAccountKey();
    if (!accountKey) {
      throw new Error('No current account');
    }

    const currentSettings = await this.getSettings();

    const updatedSettings: FastSignState = {
      ...currentSettings,
      enabled,
      expiryDate: enabled ? this._calculateExpiryDate() : null,
    };

    this._store.state[accountKey] = updatedSettings;
  }

  /**
   * Get trusted dApps list
   */
  public async getTrustedDapps(): Promise<TrustedDapp[]> {
    const settings = await this.getSettings();
    return settings.trustedDapps;
  }

  /**
   * Batch update all trusted dApps
   */
  public async updateTrustedDapps(dapps: TrustedDapp[]): Promise<void> {
    const accountKey = this._getAccountKey();
    if (!accountKey) {
      throw new Error('No current account');
    }

    const currentSettings = await this.getSettings();
    const updatedSettings: FastSignState = {
      ...currentSettings,
      trustedDapps: dapps,
    };

    this._store.state[accountKey] = updatedSettings;
  }

  /**
   * Check if a dApp origin is trusted and enabled
   * Returns true only if fast signing is enabled AND dApp is in trusted list with enabled=true
   */
  public async isTrustedDapp(origin: string): Promise<boolean> {
    const settings = await this.getSettings();

    // Fast signing must be enabled
    if (!settings.enabled) {
      return false;
    }

    // Check if expired
    if (settings.expiryDate && new Date(settings.expiryDate) < new Date()) {
      return false;
    }

    // Normalize origin (remove trailing slash, protocol, etc.)
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');

    // Check if any trusted dApp matches the origin
    return settings.trustedDapps.some((dapp) => {
      if (!dapp.enabled) return false;

      try {
        const dappUrl = new URL(dapp.url);
        const dappOrigin = dappUrl.origin.toLowerCase();
        return normalizedOrigin.includes(dappOrigin) || dappOrigin.includes(normalizedOrigin);
      } catch {
        return false;
      }
    });
  }
}

export default FastSignManagerService;
export type { TrustedDapp };
