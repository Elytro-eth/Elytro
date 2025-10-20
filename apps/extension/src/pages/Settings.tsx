import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import {
  ExternalLinkIcon,
  LayoutGridIcon,
  LockKeyholeIcon,
  Settings2Icon,
  ShieldIcon,
  RefreshCcw,
  WalletCardsIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useWallet } from '@/contexts/wallet';
import SettingItem from '@/components/ui/SettingItem';
import AccountsDropdown from '@/components/biz/AccountsDropdown';
import pkg from '../../package.json';
import { useAccount } from '@/contexts/account-context';

export default function Settings() {
  const { wallet } = useWallet();
  const handleLock = async () => {
    await wallet.lock();
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
  };
  const appVersion = pkg.version;
  const {
    currentAccount: { needUpgrade },
  } = useAccount();

  return (
    <SecondaryPageWrapper title="Settings">
      <div className="space-y-2">
        <h2 className="elytro-text-small-bold text-gray-600 pd-md">Wallet settings</h2>
        <div className="space-y-2">
          <AccountsDropdown className="bg-gray-150" />
          <SettingItem icon={LayoutGridIcon} label="Connected apps" path={SIDE_PANEL_ROUTE_PATHS.Connection} />

          <SettingItem icon={ShieldIcon} label="Recovery" path={SIDE_PANEL_ROUTE_PATHS.RecoverySetting} />

          {needUpgrade && (
            <SettingItem
              icon={RefreshCcw}
              label="Update contract"
              path={SIDE_PANEL_ROUTE_PATHS.UpgradeContract}
              showRedDot
            />
          )}
        </div>
      </div>

      <div>
        <h2 className="elytro-text-small-bold text-gray-600 my-4">Local settings</h2>
        <div className="space-y-2">
          <SettingItem icon={UserRoundIcon} label="Change passcode" path={SIDE_PANEL_ROUTE_PATHS.ChangePassword} />
          <SettingItem icon={Settings2Icon} label="Networks" path={SIDE_PANEL_ROUTE_PATHS.NetworkConfiguration} />
          <SettingItem icon={WalletCardsIcon} label="Backup wallets" path={SIDE_PANEL_ROUTE_PATHS.ExportBackup} />
        </div>
        <div className="flex flex-col space-y-2 w-full mt-8 mb-4">
          <Button variant="secondary" onClick={handleLock}>
            <LockKeyholeIcon className="w-4 h-4 mr-2 duration-100 group-hover:stroke-white" />
            Lock Elytro
          </Button>

          <Button variant="outline" asChild>
            <a href="https://elytro.com/faq" target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              FAQ
            </a>
          </Button>
        </div>

        <div className="text-center text-gray-450">
          <p>
            <a
              className="text-gray-450 hover:text-gray-750"
              href="https://t.me/+l9coqJq9QHgyYjI1"
              target="_blank"
              rel="noreferrer"
            >
              Join Telegram
            </a>
            <a
              className="ml-3 text-gray-450 hover:text-gray-750"
              href="https://elytro.notion.site/elytro-terms-of-use"
              target="_blank"
              rel="noreferrer"
            >
              Terms of Use
            </a>
            <a
              className="ml-3 text-gray-450 hover:text-gray-750"
              href="https://elytro.notion.site/elytro-privacy-policy"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            <span className="ml-3 text-gray-450">V.{appVersion}</span>
          </p>
        </div>
      </div>
    </SecondaryPageWrapper>
  );
}
