import { SupportedChainTypeEn } from '@/constants/chains';
import { approvalService } from './services/approval';
import connectionManager from './services/connection';
import keyring from './services/keyring';
import walletClient from './services/walletClient';
import { elytroSDK } from './services/sdk';
import { hashEarlyTypedData, hashSignTypedData } from '@/utils/hash';
import { ethErrors } from 'eth-rpc-errors';
import sessionManager from './services/session';
import { deformatUserOperation } from '@/utils/format';
import historyManager from './services/history';
import { UserOperationHistory } from '@/constants/operations';
import networkService from './services/networks';
import accountManager, { Account } from './services/accountManager';
import { Address, formatEther } from 'viem';

// ! DO NOT use getter. They can not be proxied.
class WalletController {
  constructor() {
    // walletClient.init();
  }

  public async createNewOwner(password: string) {
    return await keyring.createNewOwner(password);
  }

  /**
   * Get Keyring is Locked or not
   */
  public async getLockStatus() {
    await keyring.tryUnlock();
    return keyring.locked;
  }

  /**
   * Get Smart Account Owner Address
   */
  public async getOwnerAddress() {
    return keyring.owner?.address;
  }

  /**
   * Get Smart Account Info
   */
  public async getSmartAccountInfo() {
    const account = accountManager.currentAccount;
    if (account) {
      const balance = await walletClient.getBalance(account.address as Address);
      return {
        address: account.address,
        ownerAddress: account.ownerAddress,
        isActivated: account.isActivated,
        balance: formatEther(balance),
      };
    }
    return null;
    // const res = await walletClient.initSmartAccount();

    // if (res) {
    //   sessionManager.broadcastMessage('accountsChanged', [res.address]);
    // }

    // return res;
  }

  public async lock() {
    return await keyring.lock();
  }

  public async unlock(password: string) {
    return await keyring.unlock(password);
  }

  public async getCurrentApproval() {
    return approvalService.currentApproval;
  }

  public async resolveApproval(id: string, data: unknown) {
    return approvalService.resolveApproval(id, data);
  }

  public async rejectApproval(id: string) {
    return approvalService.rejectApproval(id);
  }

  public async connectWallet(dApp: TDAppInfo, chainType: SupportedChainTypeEn) {
    connectionManager.connect(dApp, chainType);
    sessionManager.broadcastMessageToDApp(dApp.origin!, 'accountsChanged', [
      accountManager?.currentAccount?.address as string,
    ]);
  }

  public async signUserOperation(userOp: ElytroUserOperation) {
    return await elytroSDK.signUserOperation(deformatUserOperation(userOp));
  }

  public async signMessage(message: string) {
    return await walletClient.signMessage(message);
  }

  public async signTypedData(typedData: string | TTypedDataItem[]) {
    try {
      let hash;
      if (typeof typedData === 'string') {
        hash = hashSignTypedData(JSON.parse(typedData));
      } else {
        hash = hashEarlyTypedData(typedData);
      }

      if (hash) {
        return await walletClient.signMessage(hash);
      }

      throw new Error('Elytro: Cannot generate hash for typed data');
    } catch (error) {
      throw ethErrors.rpc.internal((error as Error)?.message);
    }
  }

  public async addNewHistory(data: UserOperationHistory) {
    historyManager.add(data);
  }

  public getLatestHistories() {
    const res = historyManager.histories.map((item) => ({
      ...item.data,
      status: item.status,
    }));

    return res;
  }

  public getCurrentChain() {
    return networkService.currentChain;
  }

  public getChains() {
    return networkService.chains;
  }

  public activateAccount(ac: Account) {
    const account = accountManager.getAccount(ac.networkId);
    if (account) {
      accountManager.updateAccount({ ...account, isActivated: true });
    }
  }

  public getAccounts() {
    return Array.from(accountManager.accounts.values());
  }

  public async createNewSmartAccount(
    networkId: number,
    setAsCurrent?: boolean
  ) {
    const isExist = accountManager.getAccount(networkId);
    if (isExist) {
      throw new Error('Elytro: Account already exist');
    }
    try {
      await accountManager.createNewSmartAccount(networkId, setAsCurrent);
    } catch (error) {
      console.error(error);
      throw new Error('Elytro: Failed to create new account');
    }
  }

  public getCurrentAccount() {
    return accountManager.currentAccount;
  }

  public switchAccount(networkId: string) {
    const newAccount = accountManager.switchAccout(networkId);
    if (newAccount) {
      networkService.switchNetwork(networkId);
      walletClient.resetClient(Number(networkId));
      elytroSDK.resetSDK(Number(networkId));
    } else {
      throw new Error('Elytro: Account not found');
    }
  }
}

export const walletController = new WalletController();
export { WalletController };
