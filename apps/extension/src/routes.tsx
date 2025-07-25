import { TRoute } from '@/types/route';
import Dashboard from './pages/Dashboard';
import Receive from './pages/Receive';
import Settings from './pages/Settings';
import Connect from './pages/Connect';
import SendTx from './pages/SendTx';
import Alert from './pages/Alert';
import Sign from './pages/Sign';
import TxConfirm from './pages/TxConfirm';
import Create from './pages/CreatePasscode';
import YouAreIn from './pages/YouAreIn';
import CreateNewAddress from './pages/CreateNewAddress';
import Connection from './pages/Connection';
import ChainChange from './pages/ChainChange';
import Launch from './pages/Launch';
import RecoverySetting from './pages/RecoverySettings/index';
import Transfer from './pages/Transfer';
import AccountRecovery from './pages/AccountRecovery';
import RetrieveContacts from './pages/AccountRecovery/RetrieveContacts';
import ChangePassword from './pages/ChangePassword';
import ImportToken from './pages/ImportToken';
import NetworkConfiguration from './pages/NetworkConfiguration';
import UpgradeContract from './pages/UpgradeContract';
import { ApprovalTypeEn } from './constants/operations';
import Unlock from './pages/Unlock';
import ExportBackupPage from './pages/ExportBackup';
import ImportBackup from './pages/ImportBackup';
import InternalCreateAccount from './pages/InternalCreateAccount';
import InternalImportBackup from './pages/ImportBackup/internal';
import StablecoinsGas from './pages/StablecoinsGas';

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
    path: SIDE_PANEL_ROUTE_PATHS.NetworkConfiguration,
    component: NetworkConfiguration,
  },

  {
    path: SIDE_PANEL_ROUTE_PATHS.Receive,
    component: Receive,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Connect,
    component: Connect,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.SendTx,
    component: SendTx,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Alert,
    component: Alert,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Sign,
    component: Sign,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.TxConfirm,
    component: TxConfirm,
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
    path: SIDE_PANEL_ROUTE_PATHS.RetrieveContacts,
    component: RetrieveContacts,
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
];
