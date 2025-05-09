import { approvalService } from './services/approval';
import connectionManager from './services/connection';
import keyring from './services/keyring';
import walletClient from './services/walletClient';
import { elytroSDK } from './services/sdk';
import { hashEarlyTypedData, hashSignTypedData } from '@/utils/hash';
import { ethErrors } from 'eth-rpc-errors';
import sessionManager from './services/session';
import { deformatObjectWithBigInt, formatObjectWithBigInt } from '@/utils/format';
import historyManager from './services/history';
import { HistoricalActivityTypeEn } from '@/constants/operations';
import { Abi, Address, Hex, isHex, toHex, zeroAddress } from 'viem';
import chainService from './services/chain';
import accountManager from './services/account';
import type { Transaction } from '@soulwallet/sdk';
import { TChainItem } from '@/constants/chains';
import { createRecoveryRecord, getRecoveryRecord } from '@/utils/ethRpc/recovery';
import { DecodeResult } from '@soulwallet/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { TRecoveryStatus } from '@/constants/recovery';
import { getTokenList, updateUserImportedTokens } from '@/utils/tokens';
import { ABI_ERC20_BALANCE_OF } from '@/constants/abi';
import { VERSION_MODULE_ADDRESS_MAP } from '@/constants/versions';
import { isOlderThan } from '@/utils/version';

enum WalletStatusEn {
  NoOwner = 'NoOwner',
  HasOwnerButLocked = 'HasOwnerButLocked',
  NoAccount = 'NoAccount',
  HasAccountAndUnlocked = 'HasAccountAndUnlocked',
  Recovering = 'Recovering',
}

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
  public async getWalletStatus() {
    if (accountManager.recoveryRecord) {
      return WalletStatusEn.Recovering;
    }

    if (!keyring.hasOwner) {
      return WalletStatusEn.NoOwner;
    }

    if (keyring.locked) {
      return WalletStatusEn.HasOwnerButLocked;
    }

    if (!accountManager.currentAccount) {
      return WalletStatusEn.NoAccount;
    }

    return WalletStatusEn.HasAccountAndUnlocked;
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

  public async rejectApproval(id: string, e?: Error) {
    return approvalService.rejectApproval(id, e);
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
    // TODO: check this logic
    if (!userOp?.paymaster) {
      await elytroSDK.estimateGas(userOp!);
    }

    const { opHash, signature } = await elytroSDK.signUserOperation(userOp!);
    userOp.signature = signature;

    await elytroSDK.sendUserOperation(userOp);

    return opHash;
  }

  public async signMessage(message: string) {
    if (!accountManager.currentAccount?.address) {
      throw ethErrors.rpc.internal();
    }

    if (!isHex(message)) {
      throw ethErrors.rpc.invalidParams();
    }

    // todo: maybe more params check?
    return await elytroSDK.signMessage(message, accountManager.currentAccount.address);
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

  public async addNewHistory({
    type,
    opHash,
    txHash,
    from,
    decodedDetail,
    approvalId,
  }: {
    type: HistoricalActivityTypeEn;
    opHash: string;
    txHash?: string;
    from: string;
    decodedDetail: DecodeResult[];
    approvalId?: string;
  }) {
    historyManager.add({
      timestamp: Date.now(),
      type,
      opHash,
      txHash,
      from,
      // TODO: get all transferred token info
      ...getTransferredTokenInfo(decodedDetail[0]),
      approvalId,
    });
  }

  public async getLatestHistories() {
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

  private _broadcastToConnectedSites(event: ElytroEventMessage['event'], data: ElytroEventMessage['data']) {
    connectionManager.connectedSites.forEach((site) => {
      if (site.origin && !site.origin.startsWith('chrome-extension://')) {
        sessionManager.broadcastMessageToDApp(site.origin, event, data);
      }
    });
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
      return null;
    }

    try {
      const updatedInfo = { ...basicInfo };

      if (updatedInfo.isDeployed) {
        const [balance, versionInfo] = await Promise.all([
          walletClient.getBalance(basicInfo.address),
          VERSION_MODULE_ADDRESS_MAP[basicInfo.chainId]
            ? elytroSDK.getContractVersion(basicInfo.address)
            : Promise.resolve('0.0.0'),
        ]);

        updatedInfo.balance = Number(balance);
        updatedInfo.needUpgrade = isOlderThan(versionInfo, VERSION_MODULE_ADDRESS_MAP[basicInfo.chainId].latestVersion);
      } else {
        updatedInfo.isDeployed = await elytroSDK.isSmartAccountDeployed(basicInfo.address);
      }

      accountManager.updateCurrentAccountInfo(updatedInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Elytro: getCurrentAccount error', error);
      return basicInfo;
    }
  }

  public async createAccount(chainId: number) {
    if (!keyring.owner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    await this.switchChain(chainId);
    await accountManager.createAccountAsCurrent(keyring.owner.address, chainId);
    this._onAccountChanged();
  }

  public async switchChain(chainId: number) {
    if (chainId === chainService.currentChain?.id) {
      return;
    }

    const newChainConfig = chainService.switchChain(chainId);

    if (newChainConfig) {
      this._onChainConfigChanged();
    }
  }

  private async _onAccountChanged() {
    await historyManager.switchAccount(accountManager.currentAccount);
    await connectionManager.switchAccount(accountManager.currentAccount);

    this._broadcastToConnectedSites('accountsChanged', [accountManager.currentAccount?.address as string]);
  }

  public async switchAccountByChain(chainId: number) {
    await accountManager.switchAccountByChainId(chainId);
    this.switchChain(chainId);
    this._broadcastToConnectedSites('accountsChanged', []);
    this._onAccountChanged();
  }

  public async createDeployUserOp(): Promise<ElytroUserOperation> {
    if (!keyring.owner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    const deployUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(keyring.owner.address as string);

    // await elytroSDK.estimateGas(deployUserOp);

    return formatObjectWithBigInt(deployUserOp);
  }

  public async createTxUserOp(txs: Transaction[]): Promise<ElytroUserOperation> {
    const userOp = await elytroSDK.createUserOpFromTxs(accountManager.currentAccount?.address as string, txs);

    return formatObjectWithBigInt(userOp);
  }

  public async decodeUserOp(userOp: ElytroUserOperation) {
    return formatObjectWithBigInt(await elytroSDK.getDecodedUserOperation(userOp));
  }

  public async estimateGas(userOp: ElytroUserOperation): Promise<ElytroUserOperation> {
    return formatObjectWithBigInt(await elytroSDK.estimateGas(userOp));
  }

  public async packUserOp(userOp: ElytroUserOperation, amount: Hex, noSponsor = false) {
    const { userOp: userOpRes, calcResult } = await elytroSDK.getRechargeAmountForUserOp(
      userOp,
      BigInt(amount),
      noSponsor
    );

    return {
      userOp: formatObjectWithBigInt(userOpRes),
      calcResult: formatObjectWithBigInt(calcResult),
    };
  }

  public async getENSInfoByName(name: string) {
    const [address, avatar] = await Promise.all([
      walletClient.getENSAddressByName(name),
      walletClient.getENSAvatarByName(name),
    ]);
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

  public async getRecoveryInfoOfCurrentAccount() {
    return await elytroSDK.getRecoveryInfo(accountManager.currentAccount?.address);
  }

  public async queryRecoveryContactsByAddress(address: Address) {
    return await elytroSDK.queryRecoveryContacts(address);
  }

  private async getRecoveryContactsHash(contacts: string[], threshold: number) {
    const [newHash, prevInfo] = await Promise.all([
      elytroSDK.calculateRecoveryContactsHash(contacts, threshold),
      elytroSDK.getRecoveryInfo(accountManager.currentAccount?.address),
    ]);
    const prevHash = prevInfo?.contactsHash;

    return {
      prevHash,
      newHash,
    };
  }

  public async checkRecoveryContactsSettingChanged(contacts: string[], threshold: number): Promise<boolean> {
    const { prevHash, newHash } = await this.getRecoveryContactsHash(contacts, threshold);

    return prevHash !== newHash;
  }

  public async generateRecoveryContactsSettingTxs(contacts: string[], threshold: number) {
    const { prevHash, newHash } = await this.getRecoveryContactsHash(contacts, threshold);

    if (prevHash === newHash) {
      throw new Error('Elytro: New recovery contacts hash is the same as the previous.');
    }

    const [infoRecordTx, contactsSettingTx] = await Promise.all([
      elytroSDK.generateRecoveryInfoRecordTx(contacts, threshold),
      elytroSDK.generateRecoveryContactsSettingTxInfo(newHash),
    ]);

    return [infoRecordTx, contactsSettingTx];
  }

  public async localRecoveryAddress() {
    return accountManager.recoveryRecord?.address;
  }

  public async cleanRecoveryRecord() {
    accountManager.recoveryRecord = null;
  }

  public async getRecoveryRecord(address?: Address) {
    if (accountManager.recoveryRecord) {
      const record = await getRecoveryRecord(accountManager.recoveryRecord.id);

      if (record?.status === TRecoveryStatus.RECOVERY_COMPLETED) {
        this.cleanRecoveryRecord();

        accountManager.setCurrentAccount({
          address: record?.address,
          chainId: Number(record?.chainID),
          isDeployed: true,
        });
        this._onAccountChanged();
      } else if (record?.status === TRecoveryStatus.RECOVERY_CANCELED) {
        this.cleanRecoveryRecord();
      }

      return record;
    }

    if (!address) {
      throw new Error('Elytro: No address provided');
    }

    const newOwner = keyring.owner?.address;
    const chainId = chainService.currentChain?.id;
    if (!newOwner || !chainId) {
      throw new Error('Elytro: No new owner or chain id found');
    }

    const guardianInfo = await this.queryRecoveryContactsByAddress(address);

    if (!guardianInfo) {
      throw new Error('Elytro: No guardian info found');
    }

    const recoveryRecord = await createRecoveryRecord({
      newOwner,
      chainID: chainId,
      address: address,
      guardianInfo,
    });

    if (!recoveryRecord) {
      throw new Error('Elytro: failed to create recovery record');
    }

    accountManager.recoveryRecord = {
      address,
      id: recoveryRecord.recoveryRecordID,
    };

    return recoveryRecord;
  }

  public async getCurrentAccountTokens() {
    if (!accountManager.currentAccount) {
      return [];
    }

    const { address, chainId } = accountManager.currentAccount;

    const [erc20Tokens, ethBalance] = await Promise.all([getTokenList(chainId), walletClient.getBalance(address)]);

    const ethToken = {
      name: 'Ether',
      balance: Number(ethBalance),
      decimals: 18,
      symbol: 'ETH',
      address: zeroAddress,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    };

    if (erc20Tokens.length === 0) {
      return [ethToken];
    }

    const balanceResults =
      (await walletClient.client?.multicall({
        contracts: erc20Tokens.map((token) => ({
          address: token.address,
          abi: ABI_ERC20_BALANCE_OF as Abi,
          functionName: 'balanceOf',
          args: [address],
        })),
      })) ?? [];

    const processedTokens = balanceResults.reduce((acc, result, index) => {
      const token = erc20Tokens[index];
      const balance = result.status === 'success' ? Number(result.result) : 0;

      if (token.importedByUser || balance > 0) {
        acc.push({
          ...token,
          balance,
        });
      }

      return acc;
    }, [] as TTokenInfo[]);

    return [ethToken, ...processedTokens];
  }

  public async importToken(token: TTokenInfo) {
    if (!accountManager.currentAccount) {
      throw new Error('No current wallet');
    }

    await updateUserImportedTokens(accountManager.currentAccount.chainId, token);
  }

  public async getInstalledUpgradeModules() {
    if (!accountManager.currentAccount) {
      return [];
    }

    return await elytroSDK.getInstalledUpgradeModules(accountManager.currentAccount.address);
  }
}

const walletController = new WalletController();

export { walletController, WalletController, WalletStatusEn };
