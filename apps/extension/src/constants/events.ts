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
    CONNECTED_SITES_UPDATED: 'connectedSitesUpdated',
  },
  EIP5792: {
    CALLS_CREATED: 'eip5792CallsCreated',
    CALLS_COMPLETED: 'eip5792CallsCompleted',
    CALLS_FAILED: 'eip5792CallsFailed',
    CALLS_STATUS_UPDATED: 'eip5792CallsStatusUpdated',
  },
  SECURITY_HOOK: {
    GET_HOOK_SIGNATURE_FAILED: 'getHookSignatureFailed',
  },
};
