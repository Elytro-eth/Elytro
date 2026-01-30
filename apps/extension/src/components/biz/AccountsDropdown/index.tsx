import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  toast,
  cn,
} from '@elytro/ui';
import AccountOption from './AccountOption';
import { getIconByChainId, getChainNameByChainId } from '@/constants/chains';
import { formatAddressToShort, formatTokenAmount } from '@/utils/format';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import { navigateTo } from '@/utils/navigation';

interface IAccountsDropdownProps {
  className?: string;
  chainId?: number;
}

export default function AccountsDropdown({ className, chainId }: IAccountsDropdownProps) {
  const [open, setOpen] = useState(false);
  const { currentAccount, accounts, getAccounts, reloadAccount } = useAccount();
  const { wallet } = useWallet();

  const showAccounts = useMemo(() => {
    let filtered = accounts;
    if (chainId) {
      filtered = accounts.filter((account) => Number(account.chainId) === Number(chainId));
    }

    // Separate current account from others
    const current = filtered.find((account) => account.address === currentAccount?.address);
    const others = filtered.filter((account) => account.address !== currentAccount?.address);

    return { current, others };
  }, [accounts, chainId, currentAccount]);

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
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateNewAddress);
  };

  const handleSelectAccount = async (account: TAccountInfo) => {
    const MIN_LOADING_DURATION = 500; // Minimum 500ms loading time

    try {
      // Execute wallet switch
      await wallet.switchAccount(account);

      // Trigger reload with minimum loading duration
      // This ensures the loading animation shows for at least 500ms
      await reloadAccount(false, MIN_LOADING_DURATION);
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
            'max-w-fit cursor-pointer flex items-center gap-x-sm rounded-[8px] bg-white px-sm py-xs text-gray-750 hover:bg-gray-300',
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
        className="w-[calc(100vw-32px)] bg-white rounded-md shadow-lg p-0"
      >
        <div className="flex flex-col p-0">
          {/* Current Account - Highlighted */}
          {showAccounts.current && (
            <div
              className="flex flex-col items-center gap-y-xs px-lg py-2xl cursor-pointer bg-blue-50 rounded-sm m-2"
              onClick={() => handleSwitchAccount(showAccounts.current!)}
            >
              <FragmentedAddress
                address={showAccounts.current.address}
                chainId={showAccounts.current.chainId}
                size="lg"
                iconSize="size-16"
                className="flex-col items-center"
                extra={
                  <div className="flex flex-col items-center gap-y-0 mt-0">
                    <span className="elytro-text-small-body text-gray-750">
                      {getChainNameByChainId(showAccounts.current.chainId)}
                    </span>
                    <span className="elytro-text-small-body text-gray-750">
                      {formatTokenAmount(showAccounts.current?.balance, 18, 'ETH')}
                    </span>
                  </div>
                }
                extraLayout="column"
              />
            </div>
          )}

          {/* Header for other accounts */}
          <div className="flex items-center justify-between gap-x-3xl px-md">
            <span className="elytro-text-small-bold text-gray-900">Your wallets</span>
            <Button variant="secondary" size="tiny" className="elytro-text-tiny-body" onClick={handleAddAccount}>
              Add new wallet
            </Button>
          </div>

          {/* Other Accounts */}
          <div className="flex flex-col p-sm">
            {showAccounts.others.map((account) => (
              <AccountOption
                key={account.address}
                account={account}
                isSelected={false}
                onDelete={() => handleRemoveAccount(account)}
                onSelect={() => handleSwitchAccount(account)}
                showDelete
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-sm bg-brown-300 px-lg py-sm">
          <span className="elytro-text-tiny-body text-brown-750">Different network, different address</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
