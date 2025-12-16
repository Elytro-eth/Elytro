import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getChainNameByChainId, getIconByChainId } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import { formatAddressToShort, formatTokenAmount } from '@/utils/format';
import { cn } from '@/utils/shadcn/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface IAccountOptionProps {
  account: TAccountInfo;
  isSelected: boolean;
  onDelete?: () => void;
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
  const [isOpen, setIsOpen] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleDelete = () => {
    if (!hasConfirmed) {
      return;
    }

    if (isSelected) {
      toast({
        title: 'Cannot delete current wallet',
        // description: 'Please switch to another wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsOpen(false);
    onDelete?.();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-x-xl justify-between px-lg py-md cursor-pointer hover:bg-gray-150',
        isSelected && 'bg-gray-50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-sm">
        <Avatar>
          <AvatarImage className="size-8 rounded-full" src={getIconByChainId(account.chainId)} />
          <AvatarFallback>{account.chainId}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-y-0">
          <span className="font-bold text-sm">{formatAddressToShort(account.address)}</span>
          <span className="elytro-text-tiny-body text-gray-500">{getChainNameByChainId(account.chainId)}</span>
        </div>
      </div>

      <div className="text-sm text-gray-600 flex flex-row items-center">
        <span className="text-gray-600">{formatTokenAmount(account?.balance, 18, 'ETH')}</span>
        {showDelete && !isSelected ? (
          <Trash2
            className="size-4 stroke-gray-600 hover:stroke-gray-900 ml-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          />
        ) : (
          <span></span>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="gap-y-lg max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete from this device</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-y-sm">
            <div className="flex items-start gap-x-sm" onClick={() => setHasConfirmed((prev) => !prev)}>
              <Checkbox checked={hasConfirmed} />
              <Label className="elytro-text-small-body text-gray-600 cursor-pointer">
                I understand I’ll lose access to this wallet unless I’ve backed up or enabled Recovery.
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-sm">
            <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)} size="small">
              Cancel
            </Button>

            <Button
              className="w-full"
              onClick={handleDelete}
              disabled={!hasConfirmed}
              variant="destructive"
              size="small"
            >
              DELETE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
