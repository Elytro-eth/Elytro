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
  UserRoundIcon,
} from 'lucide-react';
import { useWallet } from '@/contexts/wallet';
import SettingItem from '@/components/ui/SettingItem';
import AccountsDropdown from '@/components/biz/AccountsDropdown';

export default function Settings() {
  const { wallet } = useWallet();
  const handleLock = async () => {
    await wallet.lock();
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
  };

  return (
    <SecondaryPageWrapper
      title="Settings"
      footer={
        <div className="flex flex-col space-y-2 w-full">
          <Button variant="secondary" onClick={handleLock}>
            <LockKeyholeIcon className="w-4 h-4 mr-2 duration-100 stroke-dark-blue group-hover:stroke-white" />
            Lock Elytro
          </Button>

          <Button variant="outline">
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            FAQ
          </Button>

          <div className="text-center text-gray-750">
            {/* TODO: add link to join telegram group */}
            <p>Join Telegram group</p>
            <p>Version 1.00. Third party software licenses</p>
          </div>
        </div>
      }
    >
      <div className="bg-gray-150 p-lg rounded-sm space-y-2">
        <h2 className="elytro-text-small-bold text-gray-600 pd-md">
          Account settings
        </h2>
        <div className="space-y-2">
          <AccountsDropdown />
          <SettingItem
            icon={ShieldIcon}
            label="Social Recovery"
            path={SIDE_PANEL_ROUTE_PATHS.RecoverySetting}
          />
          <SettingItem
            icon={LayoutGridIcon}
            label="Connected apps"
            path={SIDE_PANEL_ROUTE_PATHS.Connection}
          />
        </div>
      </div>
      <div className="mb-4">
        <h2 className="elytro-text-small-bold text-gray-600 my-4">
          Elytro settings
        </h2>
        <div className="space-y-2">
          <SettingItem
            icon={UserRoundIcon}
            label="Device Profile"
            path={SIDE_PANEL_ROUTE_PATHS.LocalProfile}
          />
          <SettingItem
            icon={Settings2Icon}
            label="Network configuration"
            // TODO: add network configuration page
            path={''} //SIDE_PANEL_ROUTE_PATHS.Network}
          />
        </div>
      </div>
    </SecondaryPageWrapper>
  );
}
