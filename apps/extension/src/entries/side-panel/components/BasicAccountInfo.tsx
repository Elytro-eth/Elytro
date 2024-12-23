import {
  ArrowDownLeft,
  ArrowUpRight,
  Ellipsis,
  RefreshCcw,
} from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';
import ActionButton from './ActionButton';
import ActivateButton from './ActivateButton';
import Account from './Account';
import { useAccount } from '../contexts/account-context';
import { useChain } from '../contexts/chain-context';
import Spin from '@/components/Spin';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';

export default function BasicAccountInfo() {
  const { accountInfo, accounts, getAccounts, updateTokens, updateAccount } =
    useAccount();
  const wallet = useWallet();
  const { currentChain, chains, getCurrentChain } = useChain();

  const onClickMore = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Settings);
  };

  const onClickSend = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.SendTx);
  };

  const onClickReceive = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
  };

  if (!currentChain || !accountInfo) {
    return <Spin isLoading />;
  }

  // const { integerPart, decimalPart } = formatBalance(balance, {
  //   threshold: 0.001,
  //   maxDecimalLength: 8,
  // });

  const reloadAccount = async () => {
    await updateAccount();
    await updateTokens();
  };

  const handleSwitchAccount = async (account: TAccountInfo) => {
    try {
      await wallet.switchAccountByChain(account.chainId);
      await getCurrentChain();
      await reloadAccount();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveAccount = async (address: string) => {
    try {
      await wallet.removeAccount(address);
      toast({
        title: 'Account removed successfully',
      });
      getAccounts();
    } catch (error) {
      toast({
        title: 'Account removed failed',
      });
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col p-sm pb-0 ">
      {/* Chain & Address */}
      <div className="flex flex-row gap-2 w-full items-center justify-between mb-lg">
        <Account
          key={accountInfo.chainId}
          chains={chains}
          chain={currentChain}
          currentAccount={accountInfo}
          accounts={accounts}
          onClickAccount={handleSwitchAccount}
          onDeleteAccount={handleRemoveAccount}
        />
        <div className="flex flex-row gap-lg">
          <Ellipsis className="elytro-clickable-icon" onClick={onClickMore} />
          <RefreshCcw
            className="elytro-clickable-icon"
            onClick={reloadAccount}
          />
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
        <div className="flex flex-row gap-sm">
          {accountInfo.isDeployed ? (
            <>
              <ActionButton
                className="bg-light-green"
                icon={<ArrowDownLeft />}
                label="Receive"
                onClick={onClickReceive}
              />
              <ActionButton
                icon={<ArrowUpRight />}
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
