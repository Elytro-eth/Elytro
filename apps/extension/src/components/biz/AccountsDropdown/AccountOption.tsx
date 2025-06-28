import { useAlert } from '@/components/ui/alerter';
import { getIconByChainId } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import { formatAddressToShort, formatTokenAmount } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Trash2 } from 'lucide-react';

interface IAccountOptionProps {
  account: TAccountInfo;
  isSelected: boolean;
  onDelete: () => void;
  onSelect: () => void;
  showDelete?: boolean;
}

export default function AccountOption({
  account,
  isSelected,
  onDelete,
  onSelect,
  showDelete = true,
}: IAccountOptionProps) {
  const { elytroAlert } = useAlert();

  const handleDelete = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();

    if (isSelected) {
      toast({
        title: 'Cannot delete current wallet',
        // description: 'Please switch to another wallet',
        variant: 'destructive',
      });
      return;
    }

    elytroAlert({
      title: 'Delete from this device',
      description: 'The wallet can be recovered later.',
      onConfirm: onDelete,
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-x-xl justify-between px-lg py-md cursor-pointer hover:bg-gray-300',
        isSelected && 'bg-gray-150'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-sm">
        <Avatar>
          <AvatarImage className="size-8 rounded-full" src={getIconByChainId(account.chainId)} />
          <AvatarFallback>{account.chainId}</AvatarFallback>
        </Avatar>

        <span className="font-bold text-sm">{formatAddressToShort(account.address)}</span>
      </div>

      <div className="text-sm text-gray-600 flex flex-row items-center">
        <span className="text-gray-600">{formatTokenAmount(account?.balance, 18, 'ETH')}</span>
        {showDelete && !isSelected ? (
          <Trash2 className="size-4 stroke-gray-600 hover:stroke-gray-900 ml-sm" onClick={handleDelete} />
        ) : (
          <span></span>
        )}
      </div>
    </div>
  );
}
