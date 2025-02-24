import { Method } from '@soulwallet/decoder';

export enum UserOperationStatusEn {
  pending = 'pending',
  confirmedSuccess = 'success',
  confirmedFailed = 'failed',
  // error = 'error',
}

export type TDAppActionDetail = {
  dAppLogo?: string;
  name: string;
  description?: string;
};

export type TTxDetail = {
  from: string;
  to: string;
  value: number;
  fee: string;
  callData: string;
};

export enum ApprovalTypeEn {
  Unlock = 'Unlock',
  Connect = 'Connect',
  SendTx = 'SendTx',
  Alert = 'Alert',
  Sign = 'Sign',
  ChainChange = 'ChainChange',
}

// export enum TxStatusEn {
//   pending = 'pending',
//   confirmed = 'confirmed',
//   failed = 'failed',
// }

export enum HistoricalActivityTypeEn {
  Send = 'Send',
  Receive = 'Receive',
  ActivateAccount = 'Activate Account',
  ContractInteraction = 'Contract Interaction',
}

export type UserOperationHistory = {
  timestamp: number;
  from: string;
  to: string;
  method?: Method;
  value: string;
  decimals: number;
  symbol: string;
  logoURI?: string;
  opHash: string;
  status?: UserOperationStatusEn;
  type: Nullable<HistoricalActivityTypeEn>;
};
