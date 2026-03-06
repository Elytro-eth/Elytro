import type { Address } from 'viem';
import type { StorageAdapter, TRecoveryRecord, TRecoveryContact, RecoveryInfo, TRecoveryContactsInfo } from '../types';
import { RecoveryStatusEn } from '../types';
import type { SDKService } from './sdk';
import type { AccountService } from './account';
import type { WalletClientService } from './walletClient';

/**
 * RecoveryService — Social recovery lifecycle management.
 *
 * Manages the full guardian-based account recovery flow:
 *   1. Setup: configure guardians with threshold
 *   2. Start: initiate recovery, generate approval hash
 *   3. Monitor: poll for guardian signatures and on-chain state
 *   4. Execute: finalize recovery once delay period elapses
 *   5. Clear: clean up recovery records
 *
 * Extension equivalent: parts of WalletController + RecoveryManager
 * CLI design: explicit service calls, file-based persistence via StorageAdapter
 */
export class RecoveryService {
  private store: StorageAdapter;
  private sdk: SDKService;
  private account: AccountService;
  private walletClient: WalletClientService;

  constructor(deps: {
    store: StorageAdapter;
    sdk: SDKService;
    account: AccountService;
    walletClient: WalletClientService;
  }) {
    this.store = deps.store;
    this.sdk = deps.sdk;
    this.account = deps.account;
    this.walletClient = deps.walletClient;
  }

  // ─── Storage Keys ─────────────────────────────────────────────────

  private recordKey(address: string): string {
    return `recovery/${address.toLowerCase()}`;
  }

  // ─── Recovery Record CRUD ────────────────────────────────────────

  async getRecoveryRecord(address: string): Promise<TRecoveryRecord | null> {
    return this.store.load<TRecoveryRecord>(this.recordKey(address));
  }

  async setRecoveryRecord(address: string, record: TRecoveryRecord | null): Promise<void> {
    if (record === null) {
      await this.store.remove(this.recordKey(address));
    } else {
      await this.store.save(this.recordKey(address), record);
    }
  }

  async hasRecoveryRecord(address: string): Promise<boolean> {
    return (await this.getRecoveryRecord(address)) !== null;
  }

  // ─── Query On-Chain State ────────────────────────────────────────

  /**
   * Get recovery info from on-chain SocialRecoveryModule.
   */
  async getRecoveryInfo(address: Address): Promise<RecoveryInfo | null> {
    return this.sdk.getRecoveryInfo(address);
  }

  /**
   * Query recovery contacts from on-chain ElytroInfoRecorder.
   * Only works for wallets that used public mode when setting up guardians.
   */
  async queryRecoveryContacts(address: Address): Promise<TRecoveryContactsInfo | null> {
    return this.sdk.queryRecoveryContacts(address);
  }

  /**
   * Check if recovery contacts hash has changed (i.e. needs update).
   */
  async checkRecoveryContactsSettingChanged(address: Address, contacts: string[], threshold: number): Promise<boolean> {
    const info = await this.sdk.getRecoveryInfo(address);
    if (!info) return true; // No recovery set up yet

    const newHash = this.sdk.calculateRecoveryContactsHash(contacts, threshold);
    return info.contactsHash !== newHash;
  }

  // ─── Guardian Setup ──────────────────────────────────────────────

  /**
   * Generate transactions to set up recovery guardians.
   *
   * @param contacts    Guardian addresses
   * @param threshold   Minimum signatures required
   * @param privacyMode If true, only stores hash on-chain (contacts remain private)
   * @returns Array of transactions to include in a UserOp batch
   */
  generateRecoverySetupTxs(
    contacts: string[],
    threshold: number,
    privacyMode: boolean = false
  ): Array<{ to: string; data: string; value: string }> {
    const txs: Array<{ to: string; data: string; value: string }> = [];

    // In public mode, first record the full contact list on-chain
    if (!privacyMode) {
      txs.push(this.sdk.generateRecoveryInfoRecordTx(contacts, threshold));
    }

    // Always set the guardian hash on the SocialRecoveryModule
    const hash = this.sdk.calculateRecoveryContactsHash(contacts, threshold);
    txs.push(this.sdk.generateRecoveryContactsSettingTx(hash));

    return txs;
  }

  // ─── Recovery Initiation ─────────────────────────────────────────

  /**
   * Start a recovery operation for a wallet.
   *
   * Creates the recovery record with approval hash and recovery ID.
   * After this, guardians need to sign the approveHash.
   *
   * @param walletAddress  The smart account to recover
   * @param newOwner       The new owner EOA address
   * @param chainId        Chain ID of the smart account
   * @param contacts       Guardian contacts (from on-chain or manual input)
   * @param threshold      Required number of guardian signatures
   */
  async startRecovery(
    walletAddress: Address,
    newOwner: Address,
    chainId: number,
    contacts: TRecoveryContact[],
    threshold: number
  ): Promise<TRecoveryRecord> {
    // Get nonce from on-chain
    const nonce = await this.sdk.getRecoveryNonce(walletAddress);

    // Generate the EIP-712 hash that guardians must sign
    const approveHash = await this.sdk.generateRecoveryApproveHash(walletAddress, nonce, [newOwner]);

    // Compute deterministic recovery ID
    const recoveryID = await this.sdk.getRecoveryOnchainID(walletAddress, nonce, [newOwner]);

    // Get current block for event scanning
    const currentBlock = await this.walletClient.getBlockNumber();

    const record: TRecoveryRecord = {
      address: walletAddress,
      chainId,
      salt: '0x' + '0'.repeat(64),
      threshold,
      approveHash,
      recoveryID,
      signedGuardians: [],
      status: RecoveryStatusEn.WAITING_FOR_SIGNATURE,
      fromBlock: currentBlock.toString(),
      contacts,
      owner: newOwner,
    };

    await this.setRecoveryRecord(walletAddress, record);
    return record;
  }

  /**
   * Import an existing recovery record (e.g. from another CLI instance).
   */
  async importRecoveryRecord(record: TRecoveryRecord): Promise<void> {
    await this.setRecoveryRecord(record.address, record);
  }

  // ─── Status Polling ──────────────────────────────────────────────

  /**
   * Update the recovery status by checking on-chain state.
   *
   * State machine:
   *   WAITING_FOR_SIGNATURE → check guardian ApproveHash events
   *   SIGNATURE_COMPLETED → check on-chain operation state
   *   RECOVERY_STARTED → check on-chain operation state
   *   RECOVERY_READY → finalization available
   *   RECOVERY_COMPLETED → done
   *
   * @returns true if status changed, false otherwise
   */
  async updateRecoveryStatus(walletAddress: string): Promise<boolean> {
    const record = await this.getRecoveryRecord(walletAddress);
    if (!record) return false;

    const prevStatus = record.status;

    // Phase 1: Check guardian signatures
    if (record.status === RecoveryStatusEn.WAITING_FOR_SIGNATURE) {
      await this.checkGuardianSignatures(record);
    }

    // Phase 2: Check on-chain state
    if (record.status === RecoveryStatusEn.RECOVERY_STARTED || record.status === RecoveryStatusEn.SIGNATURE_COMPLETED) {
      const onchainStatus = await this.sdk.checkOnchainRecoveryStatus(record.address as Address, record.recoveryID);
      record.status = onchainStatus;
    }

    // Phase 3: Handle completion
    if (record.status === RecoveryStatusEn.RECOVERY_COMPLETED) {
      // Update account record
      const acct = this.account.resolveAccount(record.address);
      if (acct) {
        await this.account.updateAccountRecoveryState(record.address as Address, true);
      }
    }

    // Persist updated record
    await this.setRecoveryRecord(walletAddress, record);

    return prevStatus !== record.status;
  }

  /**
   * Check each unsigned guardian for on-chain ApproveHash events.
   */
  private async checkGuardianSignatures(record: TRecoveryRecord): Promise<void> {
    const signedCount = record.contacts.filter((c) => c.confirmed).length;

    // Already have enough
    if (signedCount >= record.threshold) {
      record.status = RecoveryStatusEn.SIGNATURE_COMPLETED;
      return;
    }

    // Check each unsigned guardian
    for (const contact of record.contacts) {
      if (!contact.confirmed) {
        const isSigned = await this.sdk.checkIsGuardianSigned(
          contact.address as Address,
          BigInt(record.fromBlock),
          record.approveHash
        );

        if (isSigned) {
          contact.confirmed = true;
          record.signedGuardians.push(contact.address);

          const newSignedCount = record.contacts.filter((c) => c.confirmed).length;
          if (newSignedCount >= record.threshold) {
            record.status = RecoveryStatusEn.SIGNATURE_COMPLETED;
            return;
          }
        }
      }
    }
  }

  // ─── Recovery Execution ──────────────────────────────────────────

  /**
   * Generate the recovery execution transaction.
   * Call this when status is SIGNATURE_COMPLETED or RECOVERY_READY.
   *
   * Note: The recovery() call on SocialRecoveryModule must be sent from
   * an external EOA (not via UserOp), since the wallet is being recovered.
   * The CLI user needs to submit this via a funded EOA.
   *
   * @returns Transaction data for the recovery call
   */
  async generateRecoveryExecutionTx(
    walletAddress: string
  ): Promise<{ to: string; data: string; value: string } | null> {
    const record = await this.getRecoveryRecord(walletAddress);
    if (!record) return null;

    if (record.status !== RecoveryStatusEn.SIGNATURE_COMPLETED && record.status !== RecoveryStatusEn.RECOVERY_READY) {
      return null;
    }

    // Build guardian signatures array for packing
    // For on-chain approved guardians, signatureType = 1 (approved on-chain)
    const guardianSignatures = record.contacts
      .filter((c) => c.confirmed)
      .map((c) => ({
        signatureType: 1 as const,
        address: c.address,
        signature: '0x', // No additional signature needed for on-chain approved
      }));

    const packedSignatures = this.sdk.packGuardianSignatures(guardianSignatures);

    // The recovery call: SocialRecoveryModule.recovery(newOwner, recoveryID, guardianSignatures)
    // This is encoded as a direct contract call, not a UserOp
    const { encodeFunctionData: encode } = await import('viem');
    const { ABI_SocialRecoveryModule: abi } = await import('@elytro/abi');

    const data = encode({
      abi,
      functionName: 'recovery',
      args: [record.owner, record.recoveryID, packedSignatures],
    });

    return {
      to: this.sdk.recoveryModuleAddress,
      data,
      value: '0',
    };
  }

  // ─── Cleanup ─────────────────────────────────────────────────────

  /**
   * Clear the recovery record for a wallet.
   */
  async clearRecoveryRecord(walletAddress: string): Promise<void> {
    await this.setRecoveryRecord(walletAddress, null);
  }
}
