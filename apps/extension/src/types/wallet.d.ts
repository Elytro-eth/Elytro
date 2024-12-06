type TUserOperationPreFundResult = {
  balance: bigint;
  hasSponsored: boolean;
  missAmount: bigint;
  needDeposit: boolean;
  suspiciousOp: boolean;
};

type Account = {
  ownerAddress: string;
  address: string;
  networkId: string | number;
  isActivated: boolean;
};

type TAccountInfo = {
  balance: Nullable<string>;
} & Account;

type TTransactionInfo = {
  from: string; // Address
  to?: string; // Address. (if it's a contract deploy tx, it's null)
  gas?: string; // Hex
  value: string; // Hex
  gasPrice: string; // Hex
  input?: string; // Hex
  type?: string; // Hex
  chainId?: string; // Hex

  maxFeePerGas?: string; // Hex
  maxPriorityFeePerGas?: string; // Hex

  // sw sdk need below, maybe change it to standards arguments?
  gasLimit?: string; // Hex
  data?: string; // HEX
};

type TElytroTxInfo = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  from: string;
  txs: TTransactionInfo[];
};

type TDAppInfo = {
  name: string;
  origin?: string;
  icon: string;
};

type TSignData = {
  method:
    | 'personal_sign'
    | 'eth_signTypedData'
    | 'eth_signTypedData_v1'
    | 'eth_signTypedData_v3'
    | 'eth_signTypedData_v4';
  params: string[];
};

type TApprovalData = {
  dApp: TDAppInfo;
  tx?: TTransactionInfo[];
  options?: unknown;
  sign?: TSignData;
};

type TApprovalInfo = {
  type: ApprovalTypeEn;
  id: string;
  data?: TApprovalData;
  resolve: (data?: unknown) => void;
  reject: (data?: unknown) => void;
  winId?: number;
};
