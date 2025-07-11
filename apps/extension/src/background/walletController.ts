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
import { Abi, Address, Hex, isHex, toHex } from 'viem';
import chainService from './services/chain';
import accountManager from './services/account';
import type { Transaction } from '@soulwallet/sdk';
import { TChainItem } from '@/constants/chains';
import { DecodeResult } from '@soulwallet/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { getTokenList, updateUserImportedTokens } from '@/utils/tokens';
import { ABI_ERC20_BALANCE_OF } from '@/constants/abi';
import { VERSION_MODULE_ADDRESS_MAP } from '@/constants/versions';
import { isOlderThan } from '@/utils/version';
import { RecoveryStatusEn } from '@/constants/recovery';
import { ETH_TOKEN_INFO } from '@/constants/token';
import { decrypt, encrypt, TPasswordEncryptedData } from '@/utils/passworder';

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
    if (await accountManager.getRecoveryRecord()) {
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
        return formatObjectWithBigInt(await this.signMessage(hash));
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
    const tokenInfo =
      decodedDetail?.length > 0
        ? getTransferredTokenInfo(decodedDetail[0])
        : {
            value: '0',
            ...ETH_TOKEN_INFO,
            to: ETH_TOKEN_INFO.address,
          };

    historyManager.add({
      timestamp: Date.now(),
      type,
      opHash,
      txHash,
      from,
      ...tokenInfo,
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
    const existingAccount = accountManager.getAccountByOwnerAndChainId(
      keyring.currentOwner?.address as string,
      chainId
    );

    // if the account already exists, create a new owner for the account
    if (existingAccount) {
      await keyring.createNewOwner();
    }
    await this.switchChain(chainId);
    await accountManager.createAccountAsCurrent(keyring.currentOwner?.address as string, chainId);
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
    if (!accountManager.currentAccount) {
      console.error('Elytro: _onAccountChanged No current account');
      return;
    }

    await keyring.switchToOwner(accountManager.currentAccount.owner);
    historyManager.switchAccount(accountManager.currentAccount);
    await connectionManager.switchAccount(accountManager.currentAccount);

    this._broadcastToConnectedSites('accountsChanged', [accountManager.currentAccount?.address as string]);
  }

  public async switchAccount(account: TAccountInfo) {
    if (!account) {
      throw new Error('Elytro: Account not found');
    }

    await accountManager.switchAccount(account);
    this.switchChain(account.chainId);
    this._broadcastToConnectedSites('accountsChanged', [account.address]);
    this._onAccountChanged();
  }

  public async createDeployUserOp(): Promise<ElytroUserOperation> {
    if (!keyring.currentOwner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    const deployUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(keyring.currentOwner.address as string);

    // await elytroSDK.estimateGas(deployUserOp);

    return formatObjectWithBigInt(deployUserOp);
  }

  public async createTxUserOp(txs: Transaction[]): Promise<ElytroUserOperation> {
    if (!accountManager.currentAccount?.isDeployed && keyring.currentOwner?.address) {
      const txOpCallData = await elytroSDK.createUserOpFromTxs(accountManager.currentAccount?.address as string, txs);
      const deployOp = await elytroSDK.createUnsignedDeployWalletUserOp(
        keyring.currentOwner.address as string,
        txOpCallData.callData as `0x${string}`
      );

      await elytroSDK.estimateGas(deployOp);

      return formatObjectWithBigInt(deployOp);
    }

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

  public async queryRecoveryContactsByAddress(address: Address) {
    return await elytroSDK.queryRecoveryContacts(address);
  }

  private async _getRecoveryContactsHash(contacts: string[], threshold: number) {
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
    const { prevHash, newHash } = await this._getRecoveryContactsHash(contacts, threshold);

    return prevHash !== newHash;
  }

  public async generateRecoveryContactsSettingTxs(contacts: string[], threshold: number) {
    const { prevHash, newHash } = await this._getRecoveryContactsHash(contacts, threshold);

    if (prevHash === newHash) {
      throw new Error('Elytro: New recovery contacts hash is the same as the previous.');
    }

    const [infoRecordTx, contactsSettingTx] = await Promise.all([
      elytroSDK.generateRecoveryInfoRecordTx(contacts, threshold),
      elytroSDK.generateRecoveryContactsSettingTxInfo(newHash),
    ]);

    return [infoRecordTx, contactsSettingTx];
  }

  public async getCurrentAccountTokens() {
    if (!accountManager.currentAccount) {
      return [];
    }

    const { address, chainId } = accountManager.currentAccount;

    const [erc20Tokens, ethBalance] = await Promise.all([getTokenList(chainId), walletClient.getBalance(address)]);

    const ethToken = {
      balance: Number(ethBalance),
      ...ETH_TOKEN_INFO,
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

  public async updateRecoveryStatus() {
    let recoveryRecord = (await accountManager.getRecoveryRecord()) as TRecoveryRecord | null;
    if (!recoveryRecord) {
      return;
    }

    if (recoveryRecord.status === RecoveryStatusEn.WAITING_FOR_SIGNATURE) {
      // if the recovery record is waiting for signature, check if the contacts have signed
      const { contacts, threshold } = recoveryRecord;
      const signedContacts = contacts.filter((contact) => contact.confirmed);
      let leftSignsNeeded = threshold - signedContacts.length;

      if (leftSignsNeeded <= 0) {
        recoveryRecord.status = RecoveryStatusEn.SIGNATURE_COMPLETED;
      } else {
        const waitingContacts = contacts.filter((contact) => !contact.confirmed);

        for (const contact of waitingContacts) {
          const isSigned = await elytroSDK.checkIsGuardianSigned(
            contact.address as Address,
            BigInt(recoveryRecord.fromBlock)
          );

          if (isSigned) {
            leftSignsNeeded--;
            recoveryRecord.contacts = recoveryRecord.contacts.map((contact) =>
              contact.address === contact.address ? { ...contact, confirmed: true } : contact
            );
            if (leftSignsNeeded <= 0) {
              recoveryRecord.status = await elytroSDK.checkOnchainRecoveryStatus(
                recoveryRecord.address,
                recoveryRecord.recoveryID
              );
              break;
            }
          }
        }
      }
    } else if (recoveryRecord.status === RecoveryStatusEn.RECOVERY_COMPLETED) {
      accountManager.setCurrentAccount({
        address: recoveryRecord?.address,
        chainId: Number(recoveryRecord?.chainId),
        isDeployed: true,
        owner: recoveryRecord?.owner,
      });
      this._onAccountChanged();
      recoveryRecord = null;
    } else {
      const onChainStatus = await elytroSDK.checkOnchainRecoveryStatus(
        recoveryRecord.address,
        recoveryRecord.recoveryID
      );
      recoveryRecord.status = onChainStatus;
    }

    accountManager.updateRecoveryRecord(recoveryRecord);
  }

  public async hasRecoveryRecord() {
    return (await accountManager.getRecoveryRecord()) !== null;
  }

  public async getRecoveryRecord() {
    await this.updateRecoveryStatus();
    return (await accountManager.getRecoveryRecord()) as TRecoveryRecord;
  }

  public async createRecoveryRecord(address: Address) {
    try {
      const contactsInfo = await elytroSDK.queryRecoveryContacts(address);
      const owner = keyring.currentOwner?.address;
      const chainId = chainService.currentChain?.id;

      if (!contactsInfo) {
        throw new Error('Elytro: Wallet cannot be recovered because no recovery contacts found');
      }

      if (!owner || !chainId) {
        throw new Error('Elytro: No owner address or chainId. Try create owner and switch chain first.');
      }

      const nonce = await elytroSDK.getRecoveryNonce(address);

      const [approveHash, fromBlock, recoveryID] = await Promise.all([
        elytroSDK.generateRecoveryApproveHash(address, nonce, [owner]),
        walletClient.getBlockNumber(),
        elytroSDK.getRecoveryOnchainID(address, nonce, [owner]),
      ]);

      await accountManager.updateRecoveryRecord({
        address,
        chainId,
        ...contactsInfo,
        contacts: contactsInfo.contacts.map(
          (contact) =>
            ({
              address: contact,
              confirmed: false,
            }) as TRecoveryContact
        ),
        approveHash,
        recoveryID,
        status: RecoveryStatusEn.WAITING_FOR_SIGNATURE,
        signedGuardians: [],
        fromBlock: fromBlock.toString(),
        owner,
      });
    } catch (error) {
      console.error('Elytro: createRecoveryRecord error', error);
      throw error;
    }
  }

  public async validatePassword(password: string) {
    return await keyring.isPasswordValid(password);
  }

  // TODO: adapt to multi-owners mode
  public async importWallet(encryptedData: TPasswordEncryptedData, password: string) {
    const { owners, accounts } = await this.getImportedWalletsData(encryptedData, password);
    await keyring.importOwners(owners, password);
    accountManager.importAccounts(accounts as TAccountInfo[]);

    return true;
  }

  public async setImportedWalletsData(data: SafeAny, password: string) {
    await keyring.isPasswordValid(password);
    await keyring.importOwners(data.owners, password);
    accountManager.importAccounts(data.accounts as TAccountInfo[]);
  }

  public async getImportedWalletsData(encryptedData: TPasswordEncryptedData, password: string) {
    const decryptedDataStr = (await decrypt(encryptedData, password)) as unknown as string;

    const decryptedData = JSON.parse(decryptedDataStr);

    if (!decryptedData.owners || !decryptedData.accounts) {
      throw new Error('Elytro: Invalid wallet data');
    }

    return decryptedData;
  }

  public async exportOwnersAndAccounts(password: string, selectedAccounts: string[]) {
    const ownerInfo = (await keyring.exportOwners(password)) as {
      owners: { id: string; key: Hex }[];
      currentOwnerId: string;
    };
    let accounts = accountManager.accounts.map((account) => ({
      address: account.address,
      chainId: account.chainId,
      isDeployed: account.isDeployed,
      owner: account.owner,
    }));

    console.log('test: accounts before', accounts);
    console.log('test: ownerInfo before', ownerInfo);
    if (selectedAccounts) {
      accounts = accounts.filter((account) =>
        selectedAccounts.some((selectedAccount) => selectedAccount === account.address)
      );
      const ownerIds = accounts.map((account) => account.owner);
      ownerInfo.owners = ownerInfo.owners.filter((owner) => ownerIds.includes(owner.id));
      ownerInfo.currentOwnerId = ownerIds.find((id) => id === ownerInfo.currentOwnerId) || accounts[0].owner;
    }

    console.log('test: accounts after', accounts);
    console.log('test: ownerInfo after', ownerInfo);

    const text = JSON.stringify({
      owners: ownerInfo,
      accounts,
    });
    const encryptedText = await encrypt(text, password);
    return JSON.stringify(encryptedText);
  }
}

const walletController = new WalletController();

export { walletController, WalletController, WalletStatusEn };
