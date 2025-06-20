type TUserOperationPreFundResult = {
  balance: bigint;
  hasSponsored: boolean;
  // missAmount: bigint;
  needDeposit: boolean;
  suspiciousOp: boolean;
  gasUsed: string;
};

type TAccountInfo = {
  address: Address;
  chainId: number;
  isDeployed: boolean;
  balance?: Nullable<number>;
  needUpgrade?: boolean;
  owner?: Address;
};

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
  icon: string;
  origin?: string;
};

type TConnectedDAppInfo = TDAppInfo & {
  isConnected: boolean;
  permissions: WalletPermission[];
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
  options?: {
    reason?: string;
    name?: string;
  };
  sign?: TSignData;
  chain?: {
    method: ChainOperationEn;
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
    iconUrls: string[];
  };
};

type TApprovalInfo = {
  type: ApprovalTypeEn;
  id: string;
  data?: TApprovalData;
  resolve: (data?: unknown) => void;
  reject: (reason?: Error) => void;
};

type TRecoveryContact = {
  label?: string;
  address: string;
  confirmed?: boolean;
};

type TRecoveryContactsInfo = {
  salt: string;
  threshold: number;
  contacts: string[];
};

type TRecoveryRecord = Omit<TRecoveryContactsInfo, 'contacts'> & {
  address: Address;
  chainId: number;
  approveHash: string; // contact approve hash
  recoveryID: string; // on chain id
  signedGuardians: string[];
  status: TRecoveryStatus;
  fromBlock: string;
  contacts: TRecoveryContact[];
  owner: Address;
};

type TTokenInfo = {
  chainId?: number;
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  balance?: number; // in minimum unit
  importedByUser?: boolean;
  price?: number;
};

type TTokenPrice = {
  address: string;
  price: number;
  symbol: string;
};

type TRecentAddress = {
  address: string;
  name?: string;
  time: number;
  avatar?: string;
};
