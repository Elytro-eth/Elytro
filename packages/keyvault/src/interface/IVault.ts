import { Result } from '@elytro/result';

export interface SignData {
  address: string;
  path: string;
  message: string | Uint8Array;
  signature: string;
}

export type VaultEvents = {
  Initialized: void;
  ReInitialized: void;
  Locked: void;
  Unlocked: void;
  AccountAdded: string;
  AccountRemoved: string;
  Sign: SignData;
  PersonalSign: SignData;
  TypedDataSign: SignData;
  Ping: void;
};

export abstract class IVault /*extends EventEmitter*/ {
  // #region Vault initialization
  public abstract init(
    password: string,
    enforce?: boolean
  ): Promise<Result<void, Error>>;
  public abstract initBip39(
    phrase: string,
    password: string,
    enforce?: boolean
  ): Promise<Result<void, Error>>;
  public abstract restore(
    exportData: string,
    password: string
  ): Promise<Result<void, Error>>;
  public abstract isInitialized(): Promise<Result<boolean, Error>>;
  // #endregion end Vault initialization

  // #region lock/unlock
  public abstract unlock(password: string): Promise<Result<void, Error>>;
  public abstract lock(): Promise<Result<void, Error>>;
  public abstract isLocked(): Promise<Result<boolean, Error>>;
  // #endregion end lock/unlock

  // #region reset password
  public abstract changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<Result<void, Error>>;
  // #endregion end reset password

  // #region signer management
  public abstract getSigner(
    path: string | undefined
  ): Promise<Result<string /* EOA address */, Error>>;
  // #endregion end signer management

  // #region sign transaction
  public abstract personalSign(
    byte32Message: string | Uint8Array,
    path: string | undefined
  ): Promise<Result<SignData, Error>>;
  public abstract rawSign(
    byte32Message: string | Uint8Array,
    path: string | undefined
  ): Promise<Result<SignData, Error>>;

  //public abstract typedDataSign(path: string | undefined, domain: ethers.TypedDataDomain, types: Record<string, Array<ethers.TypedDataField>>, value: Record<string, any>, provider?: string | ethers.JsonRpcProvider): Promise<Result<SignData, Error>>;
  // #endregion end sign transaction
}
