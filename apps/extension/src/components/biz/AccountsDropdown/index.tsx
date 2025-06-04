import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AccountOption from './AccountOption';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getChainNameByChainId, getIconByChainId } from '@/constants/chains';
import { formatAddressToShort } from '@/utils/format';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { groupBy } from 'lodash';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import { navigateTo } from '@/utils/navigation';
import Spin from '@/components/ui/Spin';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsDropdown() {
  const [open, setOpen] = useState(false);
  const { currentAccount, accounts, getAccounts, reloadAccount } = useAccount();
  const { wallet } = useWallet();

  if (!currentAccount) {
    return <Spin isLoading />;
  }

  // const { integerPart, decimalPart } = formatBalance(balance, {
  //   threshold: 0.001,
  //   maxDecimalLength: 8,
  // });

  const handleAddAccount = async () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateNewAddress);
  };

  const handleSelectAccount = async (account: TAccountInfo) => {
    try {
      await wallet.switchAccountByChain(account.chainId);
      await reloadAccount();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to switch wallet, please try again',
        //description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAccount = async (account: TAccountInfo) => {
    try {
      await wallet.removeAccount(account.address);
      await reloadAccount();
      await getAccounts();
      toast({
        title: 'Wallet removed successfully',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to delete wallet, please try again',
        //description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setOpen(false);
    }
  };

  const ChevronIcon = open ? ChevronUp : ChevronDown;

  const accountGroupByChainId = groupBy(accounts, 'chainId');

  const handleSwitchAccount = (account: TAccountInfo) => {
    handleSelectAccount(account);
    setOpen(false);
  };

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      await getAccounts();
    }
    setOpen(open);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <div onClick={() => handleOpenChange(!open)}>
        <div className="max-w-fit cursor-pointer flex items-center gap-x-sm border border-gray-200 rounded-[8px] bg-white px-sm py-xs text-gray-750 hover:bg-gray-100">
          <DropdownMenuTrigger asChild>
            <Avatar className="size-4">
              <AvatarImage src={getIconByChainId(currentAccount.chainId)} />
              <AvatarFallback>
                <Skeleton className="size-4" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <span className="text-ellipsis overflow-hidden whitespace-nowrap">
            {currentAccount?.address ? (
              formatAddressToShort(currentAccount.address)
            ) : (
              <Skeleton className="w-[90px] h-[18px] rounded-[8px] bg-gray-100" />
            )}
          </span>

          <ChevronIcon className="size-3" />
        </div>
      </div>
      <DropdownMenuContent
        side="bottom"
        align="start"
        alignOffset={-9}
        sideOffset={10}
        className="w-[330px] max-w-fit bg-white rounded-md shadow-lg py-lg px-0"
      >
        <div className="flex items-center justify-between  gap-x-3xl px-lg pb-sm">
          <span className="elytro-text-small-bold text-gray-900">Switch wallet</span>
          <Button variant="outline" size="tiny" className="elytro-text-tiny-body" onClick={handleAddAccount}>
            Add new wallet
          </Button>
        </div>

        <div className="flex flex-col gap-y-sm">
          {Object.entries(accountGroupByChainId).map(([chainId, accounts]) => (
            <div key={chainId}>
              <div className="elytro-text-smaller-bold-body text-gray-600 px-lg py-sm">
                {getChainNameByChainId(Number(chainId))}
              </div>
              {accounts.map((account) => (
                <AccountOption
                  key={account.address}
                  account={account}
                  isSelected={account.address === currentAccount.address}
                  onDelete={() => handleRemoveAccount(account)}
                  onSelect={() => handleSwitchAccount(account)}
                />
              ))}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
