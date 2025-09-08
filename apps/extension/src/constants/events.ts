export const EVENT_TYPES = {
  HISTORY: {
    ITEMS_UPDATED: 'historyItemsUpdated',
    ITEM_STATUS_UPDATED: 'historyItemStatusUpdated',
    NEW_RECEIVED_MESSAGE: 'newReceivedMessage',
    TX_HASH_RECEIVED: 'txHashReceived',
  },
  APPROVAL: {
    REQUESTED: 'approvalRequested',
    PENDING: 'approvalPending',
    RESOLVED: 'approvalResolved',
  },
  CHAIN: {
    CHAIN_INITIALIZED: 'chainInitialized',
    CHAIN_CHANGED: 'chainChanged',
  },
  ACCOUNT: {
    ACCOUNT_INITIALIZED: 'accountInitialized',
    ACCOUNT_CHANGED: 'accountChanged',
  },
  UI: {
    PRIVATE_RECOVERY_READY: 'privateRecoveryReady',
  },
};
