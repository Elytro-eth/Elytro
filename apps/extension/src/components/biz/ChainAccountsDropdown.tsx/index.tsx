import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AccountOption from '../AccountsDropdown/AccountOption';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getIconByChainId } from '@/constants/chains';
import { formatAddressToShort } from '@/utils/format';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';
import Spin from '@/components/ui/Spin';
import { cn } from '@/utils/shadcn/utils';

interface IAccountsDropdownProps {
  className?: string;
  chainId: number;
  onSelect?: (account: TAccountInfo) => void;
  selectedAccount?: TAccountInfo;
}

export default function ChainAccountsDropdown({
  className,
  chainId,
  onSelect,
  selectedAccount,
}: IAccountsDropdownProps) {
  const [open, setOpen] = useState(false);
  const { accounts, getAccounts } = useAccount();
  const [showAccount, setShowAccount] = useState<TAccountInfo | undefined>(selectedAccount);
  const accountOptions = accounts.filter((account) => Number(account.chainId) === Number(chainId));

  useEffect(() => {
    getAccounts();
  }, []);

  useEffect(() => {
    if (!showAccount) {
      setShowAccount(accountOptions?.[0]);
    }
  }, [accountOptions, showAccount]);

  useEffect(() => {
    if (showAccount) {
      onSelect?.(showAccount);
    }
  }, [showAccount]);

  if (!chainId || !accountOptions?.length) {
    return <Spin isLoading />;
  }

  const ChevronIcon = open ? ChevronUp : ChevronDown;

  const handleSwitchAccount = (account: TAccountInfo) => {
    setShowAccount(account);
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
              <AvatarImage src={getIconByChainId(chainId)} />
              <AvatarFallback>
                <Spin size="sm" color="text-gray-300" isLoading inline />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <span className="text-ellipsis overflow-hidden whitespace-nowrap">
            {showAccount?.address ? (
              formatAddressToShort(showAccount.address)
            ) : (
              <Spin size="sm" color="text-gray-300" isLoading inline />
            )}
          </span>

          <ChevronIcon className="size-3" />
        </div>
      </div>
      <DropdownMenuContent
        side="bottom"
        align="start"
        alignOffset={-40}
        sideOffset={20}
        className="w-[330px] max-w-fit bg-white rounded-md shadow-lg py-lg px-0"
      >
        <div className="flex flex-col gap-y-sm">
          {accountOptions.map((account) => (
            <AccountOption
              key={account.address}
              account={account}
              showDelete={false}
              isSelected={account.address === showAccount?.address}
              onSelect={() => handleSwitchAccount(account)}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
