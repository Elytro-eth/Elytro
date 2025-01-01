import { approvalService } from './services/approval';
import connectionManager from './services/connection';
import keyring from './services/keyring';
import walletClient from './services/walletClient';
import { elytroSDK } from './services/sdk';
import { hashEarlyTypedData, hashSignTypedData } from '@/utils/hash';
import { ethErrors } from 'eth-rpc-errors';
import sessionManager from './services/session';
import {
  deformatObjectWithBigInt,
  formatObjectWithBigInt,
} from '@/utils/format';
import historyManager from './services/history';
import { UserOperationHistory } from '@/constants/operations';
import { formatEther, Hex, isHex, toHex } from 'viem';
import chainService from './services/chain';
import accountManager from './services/account';
import type { Transaction } from '@soulwallet/sdk';
import { TChainItem } from '@/constants/chains';

// ! DO NOT use getter. They can not be proxied.
// ! Please declare all methods async.
class WalletController {
  /**
   * Create a new owner for the wallet
   */
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

  public async connectSite(dApp: TDAppInfo) {
    connectionManager.connect(dApp);
    sessionManager.broadcastMessageToDApp(dApp.origin!, 'accountsChanged', [
      accountManager?.currentAccount?.address as string,
    ]);
  }

  public async getConnectedSites() {
    return connectionManager.connectedSites;
  }

  public async disconnectSite(origin: string) {
    connectionManager.disconnect(origin);
  }

  public async signUserOperation(userOp: ElytroUserOperation) {
    return await elytroSDK.signUserOperation(deformatObjectWithBigInt(userOp));
  }

  public async sendUserOperation(userOp: ElytroUserOperation) {
    return await elytroSDK.sendUserOperation(
      deformatObjectWithBigInt(userOp, ['maxFeePerGas', 'maxPriorityFeePerGas'])
    );
  }

  public async signMessage(message: string) {
    if (!accountManager.currentAccount?.address) {
      throw ethErrors.rpc.internal();
    }

    if (!isHex(message)) {
      throw ethErrors.rpc.invalidParams();
    }

    // todo: maybe more params check?
    return await elytroSDK.signMessage(
      message,
      accountManager.currentAccount.address
    );
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
        return await this.signMessage(hash);
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
    return historyManager.histories.map((item) => ({
      ...item.data,
      status: item.status,
    }));
  }

  private async _onChainConfigChanged() {
    const chainConfig = chainService.currentChain;

    if (!chainConfig) {
      throw new Error('Elytro: No current chain config');
    }

    elytroSDK.resetSDK(chainConfig);
    walletClient.init(chainConfig);

    sessionManager.broadcastMessage('chainChanged', toHex(chainConfig.id));
  }

  public async getCurrentChain() {
    return chainService.currentChain;
  }

  public async getChains() {
    return chainService.chains;
  }

  public async updateChainConfig(chainId: number, config: Partial<TChainItem>) {
    chainService.updateChain(chainId, config);

    if (chainId === chainService.currentChain?.id) {
      this._onChainConfigChanged();
    }
  }

  public async addChain(chain: TChainItem) {
    chainService.addChain(chain);
  }

  public async deleteChain(chainId: number) {
    chainService.deleteChain(chainId);
  }

  public async getAccounts() {
    return accountManager.accounts;
  }

  public async getCurrentAccount() {
    const basicInfo = accountManager.currentAccount;

    if (!basicInfo) {
      throw new Error('Elytro: No current account');
    }

    if (!basicInfo.isDeployed) {
      const isDeployed = await elytroSDK.isSmartAccountDeployed(
        basicInfo.address
      );

      if (isDeployed) {
        accountManager.activateCurrentAccount();
      }
    }

    const balanceBn = await walletClient.getBalance(basicInfo.address);
    accountManager.updateCurrentAccountInfo({
      balance: formatEther(balanceBn),
    });

    return basicInfo;
  }

  public async createAccount(chainId: number) {
    if (!keyring.owner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    await this._switchChain(chainId);
    await accountManager.createAccountAsCurrent(keyring.owner.address, chainId);
    this._onAccountChanged();
  }

  private async _switchChain(chainId: number) {
    if (chainId === chainService.currentChain?.id) {
      return;
    }

    const newChainConfig = chainService.switchChain(chainId);

    if (newChainConfig) {
      this._onChainConfigChanged();
    }
  }

  private async _onAccountChanged() {
    historyManager.switchAccount(accountManager.currentAccount);
    connectionManager.switchAccount(accountManager.currentAccount);
    sessionManager.broadcastMessage('accountsChanged', [
      accountManager.currentAccount?.address as string,
    ]);
  }

  public async switchAccountByChain(chainId: number) {
    this._switchChain(chainId);
    accountManager.switchAccountByChainId(chainId);
    this._onAccountChanged();
  }

  public async createDeployUserOp() {
    if (!keyring.owner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    const deployUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(
      keyring.owner.address as string
    );

    // await elytroSDK.estimateGas(deployUserOp);

    return formatObjectWithBigInt(deployUserOp);
  }

  public async createTxUserOp(txs: Transaction[]) {
    const userOp = await elytroSDK.createUserOpFromTxs(
      accountManager.currentAccount?.address as string,
      txs
    );

    return formatObjectWithBigInt(userOp);
  }

  public async decodeUserOp(userOp: ElytroUserOperation) {
    return formatObjectWithBigInt(
      await elytroSDK.getDecodedUserOperation(userOp)
    );
  }

  public async estimateGas(userOp: ElytroUserOperation) {
    return formatObjectWithBigInt(await elytroSDK.estimateGas(userOp, true));
  }

  public async packUserOp(userOp: ElytroUserOperation, amount: Hex) {
    const { userOp: userOpRes, calcResult } =
      await elytroSDK.getRechargeAmountForUserOp(userOp, BigInt(amount));

    return {
      userOp: formatObjectWithBigInt(userOpRes),
      calcResult: formatObjectWithBigInt(calcResult),
    };
  }

  public async getENSInfoByName(name: string) {
    const address = await walletClient.getENSAddressByName(name);
    const avatar = await walletClient.getENSAvatarByName(name);
    return {
      name,
      address,
      avatar,
    };
  }

  public async removeAccount(address: string) {
    await accountManager.removeAccountByAddress(address);
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    return await keyring.changePassword(oldPassword, newPassword);
  }
}

export const walletController = new WalletController();
export { WalletController };
