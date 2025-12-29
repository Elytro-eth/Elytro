import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AccountOption from './AccountOption';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getIconByChainId } from '@/constants/chains';
import { formatAddressToShort } from '@/utils/format';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import { navigateTo } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/shadcn/utils';

interface IAccountsDropdownProps {
  className?: string;
  chainId?: number;
}

export default function AccountsDropdown({ className, chainId }: IAccountsDropdownProps) {
  const [open, setOpen] = useState(false);
  const { currentAccount, accounts, getAccounts, reloadAccount } = useAccount();
  const { wallet } = useWallet();

  const showAccounts = useMemo(() => {
    if (chainId) {
      return accounts.filter((account) => Number(account.chainId) === Number(chainId));
    }

    return accounts;
  }, [accounts, chainId]);

  if (!currentAccount) {
    return (
      <div className="flex items-center gap-x-sm border border-gray-200 rounded-[8px] bg-white px-sm py-xs">
        <div className="size-4 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // const { integerPart, decimalPart } = formatBalance(balance, {
  //   threshold: 0.001,
  //   maxDecimalLength: 8,
  // });

  const handleAddAccount = async () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.InternalCreateAccount);
  };

  const handleSelectAccount = async (account: TAccountInfo) => {
    try {
      await wallet.switchAccount(account);
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
        <div
          className={cn(
            'max-w-fit cursor-pointer flex items-center gap-x-sm border border-gray-200 rounded-[8px] bg-white px-sm py-xs text-gray-750 hover:bg-gray-50',
            className
          )}
        >
          <DropdownMenuTrigger asChild>
            <Avatar className="size-4">
              <AvatarImage src={getIconByChainId(currentAccount.chainId)} />
              <AvatarFallback>
                <div className="size-4 rounded-full bg-gray-200" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <span className="text-ellipsis overflow-hidden whitespace-nowrap">
            {currentAccount?.address ? (
              formatAddressToShort(currentAccount.address)
            ) : (
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
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
        className="w-[calc(100vw-32px)] bg-white rounded-md shadow-lg pt-sm pb-0 px-0"
      >
        <div className="flex items-center justify-between gap-x-3xl px-lg pb-sm">
          <span className="elytro-text-small-bold text-gray-900">Your wallets</span>
          <Button variant="tertiary" size="tiny" className="elytro-text-tiny-body" onClick={handleAddAccount}>
            Add new wallet
          </Button>
        </div>

        <div className="flex flex-col">
          {showAccounts.map((account) => (
            <AccountOption
              key={account.address}
              account={account}
              isSelected={account.address === currentAccount.address}
              onDelete={() => handleRemoveAccount(account)}
              onSelect={() => handleSwitchAccount(account)}
              showDelete
            />
          ))}
        </div>

        <div className="flex flex-col gap-y-sm bg-light-brown px-lg py-sm">
          <span className="elytro-text-tiny-body text-dark-brown">Different network, different address</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
