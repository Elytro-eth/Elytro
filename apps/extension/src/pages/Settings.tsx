import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';
import {
  ExternalLinkIcon,
  LockKeyholeIcon,
  Settings2Icon,
  RefreshCcw,
  WalletCardsIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useWallet } from '@/contexts/wallet';
import SettingItem from '@/components/ui/SettingItem';
import { useAccount } from '@/contexts/account-context';
import HelperText from '@/components/ui/HelperText';
import { useState } from 'react';

export default function Settings() {
  const { wallet } = useWallet();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleLock = async () => {
    await wallet.lock();
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
  };
  const {
    currentAccount: { needUpgrade },
  } = useAccount();

  const handleNavigate = (path: SidePanelRoutePath) => {
    setIsFadingOut(true);
    // Wait for fade-out animation before navigating
    setTimeout(() => {
      navigateTo('side-panel', path);
    }, 150); // Match animation duration
  };

  return (
    <SecondaryPageWrapper title="Settings" className={isFadingOut ? 'page-fade-out' : ''}>
      <HelperText description="We are in public beta, please keep deposits small" className="mb-4" />
      <div className="space-y-2">
        <SettingItem
          icon={UserRoundIcon}
          label="Change passcode"
          onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.ChangePassword)}
        />
        <SettingItem
          icon={Settings2Icon}
          label="Networks"
          onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.NetworkConfiguration)}
        />
        <SettingItem
          icon={WalletCardsIcon}
          label="Backup accounts"
          onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.ExportBackup)}
        />
        {needUpgrade && (
          <SettingItem
            icon={RefreshCcw}
            label="Update contract"
            onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.UpgradeContract)}
            showRedDot
          />
        )}
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
            Terms
          </a>
          <a
            className="ml-3 text-gray-450 hover:text-gray-750"
            href="https://elytro.notion.site/elytro-privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy
          </a>
          <span className="ml-3 text-gray-450">V0.0.1 (Beta)</span>
        </p>
      </div>
    </SecondaryPageWrapper>
  );
}
