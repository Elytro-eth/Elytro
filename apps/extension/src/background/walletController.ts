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
import type { Transaction } from '@elytro/sdk';
import { TChainItem } from '@/constants/chains';
import { DecodeResult } from '@elytro/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { getTokenList, updateUserImportedTokens } from '@/utils/tokens';
import { ABI_ERC20_BALANCE_OF } from '@/constants/abi';
import { VERSION_MODULE_ADDRESS_MAP } from '@/constants/versions';
import { isOlderThan } from '@/utils/version';
import { RecoveryStatusEn } from '@/constants/recovery';
import { ETH_TOKEN_INFO } from '@/constants/token';
import { decrypt, encrypt, TPasswordEncryptedData } from '@/utils/passworder';
import { CoinLogoNameMap } from '@/constants/token';
import { TokenQuote } from '@/types/pimlico';
import { detectAddressType } from '@/utils/addressType';
import { setLocalContacts, setLocalThreshold } from '@/utils/contacts';
import {
  getUninstallSecurityHookTx,
  getForcePreUninstallSecurityHookTx,
  getInstallSecurityHookTx,
} from '@/utils/contracts/securityHook';
import SecurityHookService from './services/securityHook';
import type { TSecurityProfile } from './services/securityHook';
import { canUserOpGetSponsor } from '@/utils/ethRpc/sponsor';
import type { THookError } from '@/types/securityHook';
import callManager from './services/callManager';

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
  private securityHookService: SecurityHookService;

  constructor() {
    // Initialize security hook service with dependencies
    this.securityHookService = new SecurityHookService(
      (message, saAddress) => elytroSDK.signMessage(message, saAddress),
      () => accountManager.currentAccount,
      () => elytroSDK.entryPoint
    );
  }
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

  public async getUserOpHash(userOp: ElytroUserOperation): Promise<string> {
    return await elytroSDK.getUserOpHash(deformatObjectWithBigInt(userOp));
  }

  public async signUserOperation(userOp: ElytroUserOperation) {
    return await elytroSDK.signUserOperation(userOp);
  }

  public async sendUserOperation(
    userOp: ElytroUserOperation,
    noHookSignWith2FA?: boolean,
    options?: { skipEstimateGas?: boolean }
  ) {
    if (!userOp?.paymaster && !options?.skipEstimateGas) {
      await elytroSDK.estimateGas(userOp!);
    }

    console.log('test: noHookSignWith2FA', noHookSignWith2FA);

    const hookStatus = noHookSignWith2FA ? null : await this.getSecurityHookStatus();
    let opHash: string;
    let finalUserOp: ElytroUserOperation;

    if (hookStatus && hookStatus.hasPreUserOpValidationHooks) {
      const preSign = await this.signUserOperation(userOp);
      userOp.signature = preSign.signature;
      const hookSignatureRes = await this.securityHookService.getHookSignature(userOp);
      if (!hookSignatureRes?.signature) {
        return {
          code: hookSignatureRes?.code,
          challengeId: hookSignatureRes?.challengeId,
          currentSpendUsdCents: hookSignatureRes?.currentSpendUsdCents,
          dailyLimitUsdCents: hookSignatureRes?.dailyLimitUsdCents,
          maskedEmail: hookSignatureRes?.maskedEmail,
          otpExpiresAt: hookSignatureRes?.otpExpiresAt,
          projectedSpendUsdCents: hookSignatureRes?.projectedSpendUsdCents,
        };
      }
      userOp.signature = hookSignatureRes?.signature;
      const { userOp: userOpRes, opHash: opHashRes } = await elytroSDK.signUserOperationWithHook(userOp, preSign);
      finalUserOp = userOpRes;
      opHash = opHashRes;
    } else {
      const { userOp: userOpRes, opHash: opHashRes } = await elytroSDK.signUserOperation(userOp!);
      finalUserOp = userOpRes;
      opHash = opHashRes;
    }

    await elytroSDK.sendUserOperation(finalUserOp);
    return formatObjectWithBigInt(opHash);
  }

  public async sendPackedUserOperation(
    userOp: ElytroUserOperation,
    noHookSignWith2FA?: boolean
  ): Promise<string | (THookError & { userOp: ElytroUserOperation })> {
    const hookStatus = noHookSignWith2FA ? null : await this.getSecurityHookStatus();
    let opHash: string;
    let finalUserOp: ElytroUserOperation;

    if (hookStatus && hookStatus.hasPreUserOpValidationHooks) {
      const preSign = await this.signUserOperation(userOp);
      userOp.signature = preSign.signature;

      const hookSignatureRes = await this.securityHookService.getHookSignature(userOp);
      if (!hookSignatureRes?.signature) {
        return formatObjectWithBigInt({
          code: hookSignatureRes?.code,
          challengeId: hookSignatureRes?.challengeId,
          currentSpendUsdCents: hookSignatureRes?.currentSpendUsdCents,
          dailyLimitUsdCents: hookSignatureRes?.dailyLimitUsdCents,
          maskedEmail: hookSignatureRes?.maskedEmail,
          otpExpiresAt: hookSignatureRes?.otpExpiresAt,
          projectedSpendUsdCents: hookSignatureRes?.projectedSpendUsdCents,
          userOp,
        });
      }

      userOp.signature = hookSignatureRes?.signature;
      const { userOp: userOpRes, opHash: opHashRes } = await elytroSDK.signUserOperationWithHook(userOp, preSign);
      finalUserOp = userOpRes;
      opHash = opHashRes;
    } else {
      const { userOp: userOpRes, opHash: opHashRes } = await elytroSDK.signUserOperation(userOp);
      finalUserOp = userOpRes;
      opHash = opHashRes;
    }

    await elytroSDK.sendUserOperation(finalUserOp);
    return formatObjectWithBigInt(opHash);
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

  public async prepareUserOp({ params }: { params?: Transaction[] }): Promise<PrepareUserOpResult> {
    try {
      await keyring.tryUnlock();
      const { address, chainId, isDeployed } = accountManager.currentAccount || {};

      if (!address || !chainId) {
        throw new Error('Elytro: No current account');
      }

      const currentOwnerAddress = keyring.currentOwner?.address;
      if (!currentOwnerAddress) {
        throw new Error('Elytro: No current owner');
      }

      let tempUserOp: ElytroUserOperation;
      if (!isDeployed) {
        const txOpCallData = params ? await elytroSDK.createUserOpFromTxs(address, params) : { callData: '0x' };
        tempUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(
          currentOwnerAddress,
          txOpCallData.callData as `0x${string}`
        );
      } else if (params) {
        tempUserOp = await elytroSDK.createUserOpFromTxs(address, params);
      } else {
        throw new Error('Elytro: No params');
      }

      const decodedRes = await this.decodeUserOp(tempUserOp);
      let transferAmount = 0n;

      if (params) {
        transferAmount = params.reduce((acc, tx) => {
          const value = tx.value ? BigInt(tx.value) : 0n;
          return acc + value;
        }, 0n);
      } else if (decodedRes) {
        transferAmount = decodedRes.reduce((acc: bigint, curr: DecodeResult) => acc + BigInt(curr.value), 0n);
      }

      console.log('Elytro: prepareUserOp transferAmount:', transferAmount);

      await elytroSDK.estimateGas(tempUserOp);

      const [hookStatus, entryPoint, availableTokens] = await Promise.all([
        this.getSecurityHookStatus(),
        this.getEntryPoint(),
        elytroSDK.getTokenPaymaster(),
      ]);

      const canSponsor = await canUserOpGetSponsor(tempUserOp, chainId, entryPoint, hookStatus);

      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
        return Promise.race([
          promise.catch((error) => {
            // Catch and re-throw to prevent error propagation between promises
            throw error;
          }),
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs)),
        ]);
      };

      const estimations = await Promise.allSettled([
        canSponsor
          ? withTimeout(
              elytroSDK.estimateUserOpCost({ ...tempUserOp }, transferAmount, false).catch((error) => {
                console.warn('Sponsor estimation error:', error);
                throw error;
              })
            )
          : Promise.resolve(null),

        withTimeout(
          elytroSDK.estimateUserOpCost({ ...tempUserOp }, transferAmount, true).catch((error) => {
            console.error('ETH estimation error:', error);
            throw error;
          })
        ),

        ...availableTokens.map((token) =>
          withTimeout(
            elytroSDK
              .estimateUserOpCost({ ...tempUserOp }, transferAmount, true, token)
              .then((result) => ({ token, result }))
              .catch((error) => {
                console.warn(`Token ${token?.name} estimation error:`, error);
                throw error;
              })
          )
        ),
      ]);

      const gasOptions: GasOptionEstimate[] = [];

      if (estimations[0].status === 'fulfilled' && estimations[0].value) {
        const sponsorCost = estimations[0].value;
        const needDeposit = (sponsorCost.missAmount ?? 0n) > 0n;
        gasOptions.push({
          option: { type: 'sponsor' },
          gasUsed: String(sponsorCost.gasUsed ?? 0n),
          needDeposit,
          hasSufficientBalance: !needDeposit,
        });
      } else if (canSponsor && estimations[0].status === 'rejected') {
        console.warn('Failed to estimate sponsor cost:', estimations[0].reason);
      }

      if (estimations[1].status === 'fulfilled') {
        try {
          const ethCost = estimations[1].value;
          if (!ethCost || typeof ethCost !== 'object') {
            throw new Error('Invalid estimation result format');
          }
          const needDeposit = (ethCost.missAmount ?? 0n) > 0n;
          gasOptions.push({
            option: { type: 'self' },
            gasUsed: String(ethCost.gasUsed ?? 0n),
            needDeposit,
            hasSufficientBalance: !needDeposit,
            balance: ethCost.balance ?? 0n,
          });
        } catch (error) {
          console.error('Failed to process ETH estimation result:', error, 'Raw result:', estimations[1].value);
        }
      } else {
        console.error('Failed to estimate ETH cost:', estimations[1].reason);
      }

      // Process ERC20 token estimations
      for (let i = 2; i < estimations.length; i++) {
        const estimation = estimations[i];
        const token = availableTokens[i - 2];

        if (estimation.status === 'fulfilled') {
          try {
            const estimationValue = estimation.value as SafeAny;
            if (!estimationValue || typeof estimationValue !== 'object') {
              throw new Error('Invalid estimation result format');
            }
            const { token: tokenFromResult, result: tokenCost } = estimationValue;
            if (!tokenCost || typeof tokenCost !== 'object') {
              throw new Error('Invalid token cost result format');
            }
            const needDeposit = (tokenCost.missAmount ?? 0n) > 0n;
            gasOptions.push({
              option: { type: 'erc20', token: tokenFromResult },
              gasUsed: String(tokenCost.gasUsed ?? 0n),
              needDeposit,
              hasSufficientBalance: !needDeposit,
              balance: tokenCost.balance ?? 0n,
            });
          } catch (error) {
            console.warn(
              `Failed to process token ${token?.name} estimation result:`,
              error,
              'Raw result:',
              estimation.value
            );
          }
        } else {
          console.warn(`Failed to estimate gas for token ${token?.name}:`, estimation.reason);
        }
      }

      // Fallback: If no options available, provide a basic ETH option
      if (gasOptions.length === 0) {
        console.warn('All gas estimations failed, providing fallback ETH option');
        gasOptions.push({
          option: { type: 'self' },
          gasUsed: String(tempUserOp.callGasLimit ?? 1000000000000000n),
          needDeposit: true, // Conservative: assume deposit needed
          hasSufficientBalance: false, // Conservative: assume insufficient balance
          balance: 0,
        });
      }

      // Determine default option: prefer sponsor if available and has sufficient balance
      const defaultOption = gasOptions.find((opt) => opt.option.type === 'sponsor' && opt.hasSufficientBalance)
        ? { type: 'sponsor' as const }
        : gasOptions.find((opt) => opt.option.type === 'self')
          ? { type: 'self' as const }
          : gasOptions[0].option;

      return {
        decodedRes: formatObjectWithBigInt(decodedRes),
        gasOptions: formatObjectWithBigInt(gasOptions),
        defaultOption,
      };
    } catch (error) {
      console.error('Elytro: prepareUserOp failed with error:', error);
      // Return a minimal fallback result to prevent UI from being blank
      throw error;
      // return {
      //   decodedRes: [],
      //   gasOptions: [
      //     {
      //       option: { type: 'self' },
      //       gasUsed: '1000000000000000', // Default fallback gas estimate
      //       needDeposit: true,
      //       hasSufficientBalance: false,
      //       balance: 0,
      //     },
      //   ],
      //   defaultOption: { type: 'self' },
      // };
    }
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
    const _currentAccount = accountManager.currentAccount;
    if (!_currentAccount) {
      return;
    }

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
        // Add timeout to recoveryInfo call to prevent hanging
        const recoveryInfoPromise = elytroSDK.getRecoveryInfo(basicInfo.address).catch((error) => {
          console.error('Elytro: getRecoveryInfo error', error);
          return null; // Return null on error instead of hanging
        });

        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('Elytro: getRecoveryInfo timeout after 5s, using fallback');
            resolve(null);
          }, 5_000);
        });

        const versionMapEntry = VERSION_MODULE_ADDRESS_MAP[basicInfo.chainId];
        const [balance, versionInfo, recoveryInfo] = await Promise.all([
          walletClient.getBalance(basicInfo.address),
          versionMapEntry ? elytroSDK.getContractVersion(basicInfo.address) : Promise.resolve('0.0.0'),
          Promise.race([recoveryInfoPromise, timeoutPromise]),
        ]);

        updatedInfo.balance = Number(balance);
        updatedInfo.needUpgrade = versionMapEntry ? isOlderThan(versionInfo, versionMapEntry.latestVersion) : false;
        updatedInfo.isRecoveryEnabled =
          !!recoveryInfo?.contactsHash &&
          recoveryInfo.contactsHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      } else {
        updatedInfo.isDeployed = await elytroSDK.isSmartAccountDeployed(basicInfo.address);
        const balance = await walletClient.getBalance(basicInfo.address);
        updatedInfo.balance = Number(balance);
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
    await keyring.tryUnlock();
    if (!keyring.currentOwner?.address) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    const deployUserOp = await elytroSDK.createUnsignedDeployWalletUserOp(keyring.currentOwner.address as string);

    // await elytroSDK.estimateGas(deployUserOp);

    return formatObjectWithBigInt(deployUserOp);
  }

  public async createTxUserOp(txs: Transaction[]): Promise<ElytroUserOperation> {
    await keyring.tryUnlock();
    if (!accountManager.currentAccount?.isDeployed && keyring.currentOwner?.address) {
      const txOpCallData = await elytroSDK.createUserOpFromTxs(accountManager.currentAccount?.address as string, txs);
      const deployOp = await elytroSDK.createUnsignedDeployWalletUserOp(
        keyring.currentOwner.address as string,
        txOpCallData.callData as `0x${string}`
      );

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

  public async packUserOp(userOp: ElytroUserOperation, amount: Hex, noSponsor = false, gasToken?: TokenQuote) {
    const { userOp: userOpRes, calcResult } = await elytroSDK.getRechargeAmountForUserOp(
      userOp,
      BigInt(amount),
      noSponsor,
      gasToken
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

  public async getRecoveryInfo(address: Address) {
    const recoveryInfo = await elytroSDK.getRecoveryInfo(address);
    return formatObjectWithBigInt(recoveryInfo);
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
    const { prevHash = '0x0000000000000000000000000000000000000000000000000000000000000000', newHash } =
      await this._getRecoveryContactsHash(contacts, threshold);

    return prevHash !== newHash;
  }

  public async generateRecoveryContactsSettingTxs(contacts: string[], threshold: number, isPrivacyMode: boolean) {
    const { prevHash, newHash } = await this._getRecoveryContactsHash(contacts, threshold);

    if (prevHash === newHash) {
      throw new Error('Elytro: New recovery contacts hash is the same as the previous.');
    }
    if (isPrivacyMode) {
      const tx = await elytroSDK.generateRecoveryContactsSettingTxInfo(newHash);
      return [tx];
    } else {
      const [infoRecordTx, contactsSettingTx] = await Promise.all([
        elytroSDK.generateRecoveryInfoRecordTx(contacts, threshold),
        elytroSDK.generateRecoveryContactsSettingTxInfo(newHash),
      ]);
      return [infoRecordTx, contactsSettingTx];
    }
  }

  public async getTokenInfo(address: Address): Promise<TTokenInfo> {
    const tokenInfo = await walletClient.getTokenInfo(address);
    return tokenInfo;
  }

  public async getCurrentAccountTokens() {
    if (!accountManager.currentAccount) {
      return [];
    }

    const { address, chainId } = accountManager.currentAccount;

    const [erc20Tokens, ethBalance, supportedGasTokens] = await Promise.all([
      getTokenList(chainId),
      walletClient.getBalance(address),
      (async (): Promise<TTokenInfo[]> => {
        const tokens = await elytroSDK.getSupportedGasTokens();
        if (tokens.length === 0) {
          return [];
        }

        return tokens.map((token) => ({
          name: token.name,
          address: token.token,
          decimals: token.decimals,
          symbol: token.symbol,
        })) as TTokenInfo[];
      })(),
    ]);

    const ethToken = {
      balance: Number(ethBalance),
      ...ETH_TOKEN_INFO,
    };

    if (erc20Tokens.length === 0 && supportedGasTokens.length === 0) {
      return [ethToken];
    }

    // remove duplicate tokens
    const allTokens = [...erc20Tokens, ...supportedGasTokens].filter(
      (token, index, self) => index === self.findIndex((t) => t.address.toLowerCase() === token.address.toLowerCase())
    );

    const balanceResults =
      (await walletClient.client?.multicall({
        contracts: allTokens.map((token) => ({
          address: token.address,
          abi: ABI_ERC20_BALANCE_OF as Abi,
          functionName: 'balanceOf',
          args: [address],
        })),
      })) ?? [];

    const processedTokens = balanceResults.reduce((acc, result, index) => {
      const token = allTokens[index];

      if (CoinLogoNameMap[token.name as keyof typeof CoinLogoNameMap]) {
        token.logoURI = CoinLogoNameMap[token.name as keyof typeof CoinLogoNameMap];
      }

      const balance = result.status === 'success' ? String(result.result) : '0';

      if (token.importedByUser || Number(balance) > 0) {
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

  public async getSecurityHookStatus() {
    if (!accountManager.currentAccount) {
      throw new Error('No current account');
    }

    const hookStatus = await elytroSDK.getSecurityHookStatus(
      accountManager.currentAccount.address,
      accountManager.currentAccount.chainId
    );

    return {
      ...hookStatus,
      currentAddress: accountManager.currentAccount.address,
    };
  }

  public async generateInstallSecurityHookTxs() {
    const { securityHookAddress, currentAddress } = await this.getSecurityHookStatus();

    return [getInstallSecurityHookTx(currentAddress, securityHookAddress)];
  }

  // Normal uninstall SecurityHook
  public async generateUninstallSecurityHookTxs() {
    const { securityHookAddress, currentAddress, isInstalled } = await this.getSecurityHookStatus();

    if (!isInstalled) {
      throw new Error('SecurityHook is not installed');
    }

    return [getUninstallSecurityHookTx(currentAddress, securityHookAddress)];
  }

  // Force uninstall SecurityHook: Step 1
  public async generatePreForceUninstallSecurityHookTxs() {
    const { securityHookAddress, isInstalled } = await this.getSecurityHookStatus();

    if (!isInstalled) {
      throw new Error('SecurityHook is not installed');
    }

    const step1Tx = getForcePreUninstallSecurityHookTx(securityHookAddress);

    return [step1Tx];
  }

  // Force uninstall SecurityHook: Step 2
  public async generateForceUninstallSecurityHookTxs() {
    const { securityHookAddress, currentAddress, isInstalled } = await this.getSecurityHookStatus();

    if (!isInstalled) {
      throw new Error('SecurityHook is not installed');
    }

    const canForceUninstall = await elytroSDK.canForceUninstallSecurityHook(securityHookAddress, currentAddress);

    if (!canForceUninstall) {
      throw new Error('Cannot force uninstall yet. Please wait for the safety delay period.');
    }

    const step2Tx = getUninstallSecurityHookTx(currentAddress, securityHookAddress);

    return [step2Tx];
  }

  public async canForceUninstallSecurityHook(): Promise<boolean> {
    const { securityHookAddress, currentAddress, isInstalled } = await this.getSecurityHookStatus();

    if (!isInstalled) {
      throw new Error('SecurityHook is not installed');
    }

    const userData = await elytroSDK.canForceUninstallSecurityHook(securityHookAddress, currentAddress);
    return userData.canForceUninstall;
  }

  public async updateRecoveryStatus(): Promise<boolean> {
    const recoveryRecord = (await accountManager.getRecoveryRecord()) as TRecoveryRecord | null;
    if (!recoveryRecord) {
      return false;
    }

    const prevStatus = recoveryRecord.status;

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
            BigInt(recoveryRecord.fromBlock),
            recoveryRecord.approveHash as `0x${string}`
          );

          if (isSigned) {
            leftSignsNeeded--;
            recoveryRecord.contacts = recoveryRecord.contacts.map((c) =>
              c.address === contact.address ? { ...c, confirmed: true } : c
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
        isRecoveryEnabled: true,
      });
      this._onAccountChanged();
      // Keep record with RECOVERY_COMPLETED so UI can show success page; clear when user clicks "Enter wallet"
    } else {
      const onChainStatus = await elytroSDK.checkOnchainRecoveryStatus(
        recoveryRecord.address,
        recoveryRecord.recoveryID
      );
      recoveryRecord.status = onChainStatus;
    }

    accountManager.updateRecoveryRecord(recoveryRecord);
    return prevStatus !== recoveryRecord?.status;
  }

  public async hasRecoveryRecord() {
    return (await accountManager.getRecoveryRecord()) !== null;
  }

  public async getRecoveryRecord() {
    await this.updateRecoveryStatus();
    return (await accountManager.getRecoveryRecord()) as TRecoveryRecord;
  }

  public async clearRecoveryRecord() {
    await accountManager.updateRecoveryRecord(null);
  }

  public async importRecoveryRecord(address: Address, chainId: number, contacts: [], threshold: number) {
    const owner = keyring.currentOwner?.address;
    if (!owner) {
      throw new Error('Elytro: No owner address. Try create owner first.');
    }

    const nonce = await elytroSDK.getRecoveryNonce(address);

    const [approveHash, fromBlock, recoveryID] = await Promise.all([
      elytroSDK.generateRecoveryApproveHash(address, nonce, [owner]),
      walletClient.getBlockNumber(),
      elytroSDK.getRecoveryOnchainID(address, nonce, [owner]),
    ]);

    const contactsInfo = contacts.map((c) => ({ address: c as Address, confirmed: false })) as TRecoveryContact[];
    await Promise.all([
      setLocalContacts(address, contactsInfo),
      setLocalThreshold(address, threshold.toString()),
      accountManager.updateRecoveryRecord({
        address,
        chainId,
        threshold,
        salt: '', // TODO: hard code salt for now
        contacts: contactsInfo,
        approveHash,
        recoveryID,
        status: RecoveryStatusEn.WAITING_FOR_SIGNATURE,
        signedGuardians: [],
        fromBlock: fromBlock.toString(),
        owner,
      }),
    ]);
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

  public async importWallet(encryptedData: TPasswordEncryptedData, password: string) {
    const { owners, accounts } = await this.getImportedWalletsData(encryptedData, password);

    await keyring.importOwners(owners, password);
    accountManager.importAccounts(accounts as TAccountInfo[]);
    this.switchAccount(accountManager.currentAccount!);

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

    if (selectedAccounts) {
      accounts = accounts.filter((account) =>
        selectedAccounts.some((selectedAccount) => selectedAccount === account.address)
      );
      const ownerIds = accounts.map((account) => account.owner);
      ownerInfo.owners = ownerInfo.owners.filter((owner) => ownerIds.includes(owner.id));
      ownerInfo.currentOwnerId = ownerIds.find((id) => id === ownerInfo.currentOwnerId) || accounts[0].owner;
    }

    const text = JSON.stringify({
      owners: ownerInfo,
      accounts,
    });
    const encryptedText = await encrypt(text, password);
    return JSON.stringify(encryptedText);
  }

  public async getTokenPaymaster() {
    return await elytroSDK.getTokenPaymaster();
  }

  public async isContractAddress(address: string) {
    return (await detectAddressType(address, walletClient.client)) === 'CONTRACT';
  }

  public async isEOAAddress(address: string) {
    return (await detectAddressType(address, walletClient.client)) === 'EOA';
  }

  public async getEntryPoint() {
    return elytroSDK.entryPoint;
  }

  /**
   * Authenticate wallet and get session ID
   */
  public async authenticateSecurityHook(): Promise<string> {
    return await this.securityHookService.authenticate();
  }

  /**
   * Clear authentication session
   */
  public async clearSecurityHookAuthSession(): Promise<void> {
    return await this.securityHookService.clearAuthSession();
  }

  /**
   * Load security profile for current account
   */
  public async loadSecurityHookProfile(): Promise<TSecurityProfile | null> {
    return await this.securityHookService.loadSecurityProfile();
  }

  /**
   * Request email binding
   */
  public async requestSecurityHookEmailBinding(
    email: string,
    locale = 'en-US'
  ): Promise<{
    bindingId: string;
    maskedEmail: string;
    otpExpiresAt: string;
    resendAvailableAt: string;
  }> {
    return await this.securityHookService.requestEmailBinding(email, locale);
  }

  /**
   * Confirm email binding with OTP
   */
  public async confirmSecurityHookEmailBinding(bindingId: string, otpCode: string): Promise<TSecurityProfile> {
    return await this.securityHookService.confirmEmailBinding(bindingId, otpCode);
  }

  /**
   * Set daily limit for current account
   */
  public async setSecurityHookDailyLimit(dailyLimitUsdCents: number, otpCode?: string): Promise<void> {
    return await this.securityHookService.setDailyLimit(dailyLimitUsdCents, otpCode);
  }

  /**
   * Request OTP for setting daily limit
   */
  public async requestDailyLimitOtp(dailyLimitUsdCents: number): Promise<{
    challengeId: string;
    maskedEmail: string;
    otpExpiresAt: string;
  }> {
    return await this.securityHookService.requestDailyLimitOtp(dailyLimitUsdCents);
  }

  /**
   * Verify OTP
   */
  public async verifyOTP(
    challengeId: string,
    otpCode: string
  ): Promise<{
    challengeId: string;
    status: string;
    verifiedAt: string;
  }> {
    return await this.securityHookService.verifySecurityOtp(challengeId, otpCode);
  }

  /**
   * Get hook signature
   */
  public async requestSecurityOtp(userOp: ElytroUserOperation): Promise<{
    challengeId: string;
    maskedEmail: string;
    otpExpiresAt: string;
  }> {
    return await this.securityHookService.requestSecurityOtp(userOp);
  }

  /**
   * Change wallet email
   */
  public async changeWalletEmail(email: string) {
    return await this.securityHookService.changeWalletEmail(email);
  }

  /**
   * Update EIP-5792 call tracking with userOpHash and start receipt polling
   * This is called after a batch call transaction is sent via TxConfirm flow
   */
  public async updateEIP5792CallWithUserOpHash(callId: string, userOpHash: string): Promise<void> {
    const tracking = callManager.getCallTracking(callId);
    if (!tracking) {
      console.warn(`[EIP-5792] Call ${callId} not found for userOpHash update`);
      return;
    }

    // Update tracking with userOpHash
    tracking.userOpHash = userOpHash;

    // Start polling for receipt (async, don't wait)
    this._waitForEIP5792Receipt(callId, userOpHash).catch((error) => {
      console.error(`[EIP-5792] Error waiting for receipt for ${callId}:`, error);
    });
  }

  /**
   * Mark an EIP-5792 call as failed
   */
  public async failEIP5792Call(callId: string, error: string): Promise<void> {
    callManager.failCalls(callId, error);
  }

  /**
   * Process EIP-5792 batch calls (legacy method, kept for backward compatibility)
   * Note: This method is no longer used as we now use TxConfirm flow
   */
  public async processEIP5792Calls(callId: string): Promise<{ id: string }> {
    const tracking = callManager.getCallTracking(callId);

    if (!tracking) {
      throw new Error('Call not found');
    }

    // Convert EIP-5792 calls to Transaction format
    const transactions: Transaction[] = tracking.calls.map((call) => ({
      to: call.to as Address,
      data: call.data as `0x${string}`,
      value: call.value || '0x0',
      gasLimit: call.gas,
    }));

    // Use default gas payment option (self-pay)
    const gasOption: GasPaymentOption = {
      type: 'self',
    };

    try {
      const result = await this.buildAndSendUserOp(transactions, gasOption);

      if (typeof result === 'string') {
        // Success - update tracking with userOpHash
        await this.updateEIP5792CallWithUserOpHash(callId, result);
        return { id: callId };
      } else {
        // Hook error
        callManager.failCalls(callId, `Hook error: ${(result as THookError).code || 'Unknown error'}`);
        throw new Error(`Hook error: ${(result as THookError).code || 'Unknown error'}`);
      }
    } catch (error) {
      callManager.failCalls(callId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Wait for UserOperation receipt and update call status
   */
  private async _waitForEIP5792Receipt(callId: string, userOpHash: string): Promise<void> {
    const maxAttempts = 60; // 5 minutes (5 seconds per attempt)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const receipt = await elytroSDK.getUserOperationReceipt(userOpHash);
      if (receipt) {
        const tracking = callManager.getCallTracking(callId);
        if (!tracking) return;

        const userOpReceipt = receipt as SafeAny;
        // Create results (simplified - in real implementation, extract return data from logs)
        const results = tracking.calls.map(() => ({
          status: (userOpReceipt.success ? 'success' : 'failure') as 'success' | 'failure',
          returnData: '0x' as `0x${string}`, // Would need to extract from receipt logs
        }));

        callManager.completeCalls(callId, results, userOpHash, userOpReceipt.transactionHash);

        return;
      }

      attempts++;
    }

    // Timeout
    callManager.failCalls(callId, 'Timeout waiting for receipt');
  }

  public async buildAndSendUserOp(
    params: Transaction[],
    option: GasPaymentOption,
    noHookSignWith2FA?: boolean
  ): Promise<string | THookError> {
    const { address, chainId, isDeployed } = accountManager.currentAccount || {};
    const currentOwnerAddress = keyring.currentOwner?.address;

    if (!address || !chainId || !currentOwnerAddress) {
      throw new Error('Elytro: No current account or owner');
    }

    let noSponsor = false;
    let gasToken: TokenQuote | undefined;
    if (option.type === 'sponsor') {
      noSponsor = false;
    } else if (option.type === 'self') {
      noSponsor = true;
    } else if (option.type === 'erc20') {
      noSponsor = true;
      gasToken = option.token;
    }

    let finalParams = params;
    if (gasToken) {
      const { getApproveErc20Tx } = await import('@/utils/tokenApproval');
      const approvalTx = getApproveErc20Tx(gasToken.token as `0x${string}`, gasToken.paymaster as `0x${string}`);
      finalParams = params.length ? [approvalTx, ...params] : [approvalTx];
    }

    let userOp: ElytroUserOperation;
    if (!isDeployed) {
      const txOpCallData = finalParams.length ? await elytroSDK.createUserOpFromTxs(address, finalParams) : undefined;
      userOp = await elytroSDK.createUnsignedDeployWalletUserOp(
        currentOwnerAddress,
        txOpCallData?.callData as `0x${string}`
      );
      userOp = await elytroSDK.estimateGas(userOp);
    } else {
      userOp = await elytroSDK.createUserOpFromTxs(address, finalParams);
    }

    const decodedRes = await elytroSDK.getDecodedUserOperation(userOp);
    const transferAmount = decodedRes?.reduce((acc: bigint, curr: DecodeResult) => acc + BigInt(curr.value), 0n);

    const { userOp: packedUserOp } = await elytroSDK.getRechargeAmountForUserOp(
      userOp,
      transferAmount,
      noSponsor,
      gasToken
    );

    return formatObjectWithBigInt(await this.sendPackedUserOperation(packedUserOp, noHookSignWith2FA));
  }
}

const walletController = new WalletController();

export { walletController, WalletController, WalletStatusEn };
