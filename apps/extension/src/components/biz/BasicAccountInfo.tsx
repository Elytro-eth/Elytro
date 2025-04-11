import { ArrowDownLeft, ArrowUpRight, Settings2Icon } from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import ActionButton from './ActionButton';
import ActivateButton from './ActivateButton';
import { useAccount } from '@/contexts/account-context';
import AccountsDropdown from './AccountsDropdown';
import Copy from '@/components/ui/Copy';
import { RedDot } from '../ui/Reddot';

export default function BasicAccountInfo() {
  const { currentAccount } = useAccount();
  const showRedDot = true;

  const onClickMore = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Settings);
  };

  const onClickSend = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.SendTx);
  };

  const onClickReceive = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
  };

  return (
    <div className="flex flex-col p-sm pb-0">
      {/* Chain & Address */}
      <div className="flex flex-row gap-3 w-full items-center justify-between mb-2">
        <div className="flex flex-row gap-x-md items-center">
          <AccountsDropdown />
          <Copy text={currentAccount.address} />
        </div>
        <div className="flex flex-row gap-x-md">
          <Settings2Icon
            className="elytro-clickable-icon"
            onClick={onClickMore}
          />
          {showRedDot && (
            <RedDot size="normal" className="absolute right-2 top-4" />
          )}
        </div>
      </div>

      {/* TODO: NOT SHOW BALANCE FOR NOW */}
      {/* Balance: $XX.xx */}
      {/* <div className="my-sm py-1 elytro-text-hero">
        <span>{integerPart}</span>
        <span className=" text-gray-450">.{decimalPart}</span> ETH
      </div> */}

      {/* Actions */}
      <div>
        <div className="flex flex-row gap-md my-sm">
          {currentAccount.isDeployed ? (
            <>
              <ActionButton
                className="bg-light-green hover:bg-green hover:stroke-white"
                icon={
                  <ArrowDownLeft className="w-5 h-5 mr-1 duration-100 transition-all group-hover:stroke-white" />
                }
                label="Receive"
                onClick={onClickReceive}
              />
              <ActionButton
                className="hover:stroke-white"
                icon={
                  <ArrowUpRight className="w-5 h-5 mr-1 duration-100 transition-all group-hover:stroke-white" />
                }
                label="Send"
                onClick={onClickSend}
              />
            </>
          ) : (
            <ActivateButton />
          )}
        </div>
      </div>
    </div>
  );
}
