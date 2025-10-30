import { ArrowDownLeft, ArrowUpRight, Box, Settings2Icon } from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import ActionButton from './ActionButton';
import { useAccount } from '@/contexts/account-context';
import AccountsDropdown from './AccountsDropdown';
import Copy from '@/components/ui/Copy';
import { RedDot } from '@/components/ui/RedDot';
import { formatAddress } from '@/utils/format';

const HeaderSection = () => {
  const { currentAccount } = useAccount();

  const handleClickSettings = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Settings);
  };

  return (
    <div className="flex flex-row gap-3 w-full items-center justify-between mb-2">
      <div className="flex flex-row gap-x-md items-center">
        <AccountsDropdown />
        <Copy text={formatAddress(currentAccount.address, currentAccount.chainId)} />
      </div>
      <div className="flex flex-row gap-x-md relative">
        <Settings2Icon className="elytro-clickable-icon" onClick={handleClickSettings} />
        {currentAccount.needUpgrade && <RedDot size="normal" className="absolute -right-1 -top-1" />}
      </div>
    </div>
  );
};

const ActionButtons = () => {
  const { currentAccount } = useAccount();

  const handleClickSend = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.SendTx);
  };

  const handleClickReceive = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
  };

  const handleClickActivateWallet = () => {
    // TODO: Implement activate wallet
  };

  if (currentAccount.isDeployed) {
    return (
      <>
        <ActionButton
          className="bg-light-green hover:bg-green hover:stroke-white"
          icon={
            <ArrowDownLeft className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />
          }
          label="Receive"
          onClick={handleClickReceive}
        />
        <ActionButton
          className="hover:stroke-white"
          icon={
            <ArrowUpRight className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />
          }
          label="Send"
          onClick={handleClickSend}
        />
      </>
    );
  }

  return (
    <ActionButton
      icon={<Box className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />}
      label="Activate wallet"
      onClick={handleClickActivateWallet}
    />
  );
};

export default function BasicAccountInfo() {
  const { currentAccount } = useAccount();
  return (
    <div className="flex flex-col p-sm pb-0">
      <HeaderSection />

      {currentAccount.isDeployed && (
        <div className="flex flex-row gap-md my-sm">
          <ActionButtons />
        </div>
      )}
    </div>
  );
}
