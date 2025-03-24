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
import CreateAccount from './pages/CreateAccount';
import YouAreIn from './pages/YouAreIn';
import CreateNewAddress from './pages/CreateNewAddress';
import LocalProfile from './pages/LocalProfile';
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
import { ApprovalTypeEn } from './constants/operations';

export enum SIDE_PANEL_ROUTE_PATHS {
  Home = '/',
  Lock = '/lock',
  Settings = '/settings',
  ChangePassword = '/settings/change-password',
  NetworkConfiguration = '/settings/network-configuration',
  Dashboard = '/dashboard',
  Activate = '/activate',
  Receive = '/receive',
  Connect = ApprovalTypeEn.Connect,
  SendTx = '/send-tx',
  Alert = ApprovalTypeEn.Alert,
  Sign = ApprovalTypeEn.Sign,
  TxConfirm = ApprovalTypeEn.TxConfirm,
  CreatePasscode = '/create-passcode',
  YouAreIn = '/you-are-in',
  CreateAccount = '/create-account',
  CreateNewAddress = '/create-new-address',
  LocalProfile = '/local-profile',
  Connection = '/connection',
  ChainChange = ApprovalTypeEn.ChainChange,
  RecoverySetting = '/recovery-setting',
  AccountRecovery = '/account-recovery',
  RetrieveContacts = '/retrieve-contacts',
  Transfer = '/transfer',
  ImportToken = '/import-token',
}

export const routes: TRoute[] = [
  {
    path: SIDE_PANEL_ROUTE_PATHS.Home,
    component: Launch,
  },
  {
    path: SIDE_PANEL_ROUTE_PATHS.Lock,
    component: () => <></>,
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
    path: SIDE_PANEL_ROUTE_PATHS.ChangePassword,
    component: ChangePassword,
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
    path: SIDE_PANEL_ROUTE_PATHS.CreateAccount,
    component: CreateAccount,
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
    path: SIDE_PANEL_ROUTE_PATHS.LocalProfile,
    component: LocalProfile,
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
];
