import { useAlert } from '@/components/ui/alerter';
import { getIconByChainId } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import { formatAddressToShort } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Trash2 } from 'lucide-react';

interface IAccountOptionProps {
  account: TAccountInfo;
  isSelected: boolean;
  onDelete: () => void;
  onSelect: () => void;
}

export default function AccountOption({
  account,
  isSelected,
  onDelete,
  onSelect,
}: IAccountOptionProps) {
  const { elytroAlert } = useAlert();

  const handleDelete = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();

    if (isSelected) {
      toast({
        title: 'Cannot delete current account',
        description: 'Please switch to another account',
        variant: 'destructive',
      });
      return;
    }

    elytroAlert({
      title: 'Delete from this device',
      description:
        'The account is still functional but is no longer accessible from this device. You can add it back any time.',
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
          <AvatarImage
            className="size-8"
            src={getIconByChainId(account.chainId)}
          />
          <AvatarFallback>{account.chainId}</AvatarFallback>
        </Avatar>

        <span className="font-bold text-sm">
          {formatAddressToShort(account.address)}
        </span>
      </div>

      <div className="elytro-text-small text-gray-600 flex flex-row items-center gap-sm">
        <span className="text-gray-600">{account?.balance}</span>
        <Trash2
          className="size-4 stroke-gray-600 hover:stroke-gray-900"
          onClick={handleDelete}
        />
      </div>
    </div>
  );
}
