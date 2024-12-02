import { ArrowDownLeft, ArrowUpRight, Ellipsis } from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';
import ActionButton from './ActionButton';
import ActivateButton from './ActivateButton';
import SendModal from './SendModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SettingModal from './SettingModal';
import AccountsModal from './AccountsModal';
import Account from './Account';
import { useAccount } from '../contexts/account-context';

export default function BasicAccountInfo() {
  const { currentChain, accounts } = useAccount();
  const [openSendModal, setOpenSendModal] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [openAccounts, setOpenAccounts] = useState(false);
  const currentAccount = accounts
    ? accounts.find((account) => account.networkId === currentChain?.id)
    : null;
  const onClickMore = () => {
    setOpenSetting(true);
  };

  const onClickSend = () => {
    setOpenSendModal(true);
  };

  const onClickReceive = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
  };

  return (
    <div className="flex flex-col p-6">
      {/* Chain & Address */}
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-row gap-2 w-full items-center justify-between">
          <div
            className="rounded-md p-2 cursor-pointer hover:bg-white"
            onClick={() => setOpenAccounts(true)}
          >
            {currentChain && (
              <Account chain={currentChain} address={currentAccount?.address} />
            )}
          </div>
          <Button variant="ghost" onClick={onClickMore}>
            <Ellipsis className="w-6 h-6 text-gray-900" />
          </Button>
        </div>
      </div>
      {/* Balance: $XX.xx */}
      {/* <div className="mt-6 text-5xl font-medium py-1">
        <span className=" text-gray-900">{balance?.split?.('.')?.[0]}</span>
        <span className=" text-gray-200">
          .{balance?.split?.('.')?.[1]?.slice(0, 3) || '000'}
        </span>
      </div> */}

      {/* Actions */}
      {currentAccount?.isActivated ? (
        <div className="grid grid-cols-2 gap-2 mt-2 ">
          <ActionButton
            icon={<ArrowDownLeft />}
            label="Receive"
            onClick={onClickReceive}
          />
          <ActionButton
            icon={<ArrowUpRight />}
            label="Send"
            onClick={onClickSend}
          />
        </div>
      ) : (
        <ActivateButton />
      )}
      <SendModal
        open={openSendModal}
        onOpenChange={() => setOpenSendModal(false)}
      />
      <SettingModal
        open={openSetting}
        onOpenChange={() => setOpenSetting(false)}
      />
      <AccountsModal
        open={openAccounts}
        onOpenChange={() => setOpenAccounts(false)}
      />
    </div>
  );
}
