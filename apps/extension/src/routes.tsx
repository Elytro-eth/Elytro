import { lazy } from 'react';
import { TRoute } from '@/types/route';
import { ApprovalTypeEn } from './constants/operations';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Receive = lazy(() => import('./pages/Receive'));
const Settings = lazy(() => import('./pages/Settings'));
const SendTx = lazy(() => import('./pages/SendTx'));
const Create = lazy(() => import('./pages/CreatePasscode'));
const YouAreIn = lazy(() => import('./pages/YouAreIn'));
const CreateNewAddress = lazy(() => import('./pages/CreateNewAddress'));
const Connection = lazy(() => import('./pages/Connection'));
const ChainChange = lazy(() => import('./pages/ChainChange'));
const Launch = lazy(() => import('./pages/Launch'));
const RecoverySetting = lazy(() => import('./pages/RecoverySettings/index'));
const Transfer = lazy(() => import('./pages/Transfer'));
const AccountRecovery = lazy(() => import('./pages/AccountRecovery'));
const RetrieveContacts = lazy(() => import('./pages/AccountRecovery/RetrieveContacts'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ImportToken = lazy(() => import('./pages/ImportToken'));
const NetworkConfiguration = lazy(() => import('./pages/NetworkConfiguration'));
const UpgradeContract = lazy(() => import('./pages/UpgradeContract'));
const Unlock = lazy(() => import('./pages/Unlock'));
const ExportBackupPage = lazy(() => import('./pages/ExportBackup'));
const ImportBackup = lazy(() => import('./pages/ImportBackup'));
const InternalCreateAccount = lazy(() => import('./pages/InternalCreateAccount'));
const InternalImportBackup = lazy(() => import('./pages/ImportBackup/internal'));
const StablecoinsGas = lazy(() => import('./pages/StablecoinsGas'));
const Education = lazy(() => import('./pages/Education'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const SecureWallet = lazy(() => import('./pages/SecureWallet'));
const SecurityHookSettings = lazy(() => import('./pages/SecurityHookSettings'));

export enum SIDE_PANEL_ROUTE_PATHS {
  Home = '/',
  Settings = '/settings',
  ChangePassword = '/settings/change-password',
  NetworkConfiguration = '/settings/network-configuration',
  UpgradeContract = '/settings/upgrade-contract',
  Dashboard = '/dashboard',
  Activate = '/activate',
  Receive = '/receive',
  Connect = ApprovalTypeEn.Connect,
  SendTx = '/send-tx',
  Alert = ApprovalTypeEn.Alert,
  Sign = ApprovalTypeEn.Sign,
  TxConfirm = ApprovalTypeEn.TxConfirm,
  CreatePasscode = '/create-passcode',
  Unlock = '/unlock',
  YouAreIn = '/you-are-in',
  // CreateAccount = '/create-account',
  CreateNewAddress = '/create-new-address',
  Connection = '/connection',
  ChainChange = ApprovalTypeEn.ChainChange,
  RecoverySetting = '/recovery-setting',
  AccountRecovery = '/account-recovery',
  RetrieveContacts = '/retrieve-contacts',
  Transfer = '/transfer',
  ImportToken = '/import-token',
  ExportBackup = '/export',
  ImportBackup = '/import',
  InternalCreateAccount = '/internal-create-account',
  InternalImportBackup = '/internal-import-backup',
  StablecoinsGas = '/stablecoins-gas',
  Education = '/education',
  CreateAccount = '/create-account',
  SecureWallet = '/secure-wallet',
  SecurityHookSettings = '/settings/security-hook',
}

export const routes: TRoute[] = [
  {
    path: SIDE_PANEL_ROUTE_PATHS.Home,
    component: Launch,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Unlock,
    component: Unlock,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.RecoverySetting,
    component: RecoverySetting,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Dashboard,
    component: Dashboard,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Settings,
    component: Settings,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.NetworkConfiguration,
    component: NetworkConfiguration,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.UpgradeContract,
    component: UpgradeContract,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.ChangePassword,
    component: ChangePassword,
  },

  {
    path: SIDE_PANEL_ROUTE_PATHS.Receive,
    component: Receive,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.SendTx,
    component: SendTx,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.CreatePasscode,
    component: Create,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.YouAreIn,
    component: YouAreIn,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.CreateNewAddress,
    component: CreateNewAddress,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.RetrieveContacts,
    component: RetrieveContacts,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Connection,
    component: Connection,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.ChainChange,
    component: ChainChange,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Transfer,
    component: Transfer,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.AccountRecovery,
    component: AccountRecovery,
  },

  {
    path: SIDE_PANEL_ROUTE_PATHS.ImportToken,
    component: ImportToken,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.ExportBackup,
    component: ExportBackupPage,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.ImportBackup,
    component: ImportBackup,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.InternalCreateAccount,
    component: InternalCreateAccount,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.InternalImportBackup,
    component: InternalImportBackup,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.StablecoinsGas,
    component: StablecoinsGas,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Education,
    component: Education,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.CreateAccount,
    component: CreateAccount,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.SecureWallet,
    component: SecureWallet,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.SecurityHookSettings,
    component: SecurityHookSettings,
  },
];
