// EIP-5792 Type Definitions

export interface EIP5792Call {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: `0x${string}`;
  gas?: `0x${string}`;
}

export interface EIP5792CallRequest {
  calls: EIP5792Call[];
  chainId?: `0x${string}`;
  capabilities?: Record<string, unknown>;
}

export interface EIP5792CallResult {
  status: 'success' | 'failure';
  returnData?: `0x${string}`;
  error?: string;
}

export interface EIP5792CallsStatus {
  status: 'pending' | 'completed' | 'failed' | number; // number for EIP-5792: 100=Pending, 200=Confirmed, 400=Failed offchain, 500=Reverted
  results?: EIP5792CallResult[];
  error?: string;
  atomic?: boolean;
  id?: string;
  receipts?: Array<{
    logs: SafeAny[];
    status: `0x${string}`;
    blockHash?: string;
    blockNumber?: string;
    gasUsed?: string;
    transactionHash?: string;
  }>;
}

export interface EIP5792Capabilities {
  atomic?: {
    status: 'ready' | 'unavailable';
  };
  atomicBatch?: {
    supported: boolean;
  };
  auxiliaryFunds?: {
    supported: boolean;
  };
  paymasterService?: {
    supported: boolean;
  };
}

export interface EIP5792WalletCapabilities {
  [chainId: string]: EIP5792Capabilities;
}

export interface EIP5792CallTracking {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  calls: EIP5792Call[];
  results?: EIP5792CallResult[];
  error?: string;
  createdAt: number;
  completedAt?: number;
  userOpHash?: string;
  txHash?: string;
}
