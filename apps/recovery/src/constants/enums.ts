enum RecoveryOperationStateEn {
  Unset = 0, // Not Started Yet. Ready to start recovery
  Waiting = 1, // Recovery started. Has to wait for safe locking period
  Ready = 2, // Safe locking period passed. Ready to complete the recovery
  Done = 3, // Recovery completed.
}

export enum RecoveryStatusEn {
  WAITING_FOR_SIGNATURE = 9, // waiting for guardian signature. Onchain don't have this status. Only used for UX processing.
  SIGNATURE_COMPLETED = RecoveryOperationStateEn.Unset, // guardian signature completed, waiting for start recovery
  RECOVERY_STARTED = RecoveryOperationStateEn.Waiting, // recovery started, waiting for recovery completed
  RECOVERY_READY = RecoveryOperationStateEn.Ready, // recovery ready to complete
  RECOVERY_COMPLETED = RecoveryOperationStateEn.Done, // recovery completed
}
