import { UserRound } from 'lucide-react';
import { cn } from '@elytro/ui';
import ShortedAddress from '@/components/ui/ShortedAddress';

interface IContactItemProps {
  contact: TRecoveryContact;
  rightContent?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function ContactItem({ contact, rightContent, isFirst, isLast }: IContactItemProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between bg-gray-50 px-lg py-md hover:bg-gray-150',
        isFirst && 'rounded-t-md',
        isLast && 'rounded-b-md',
        !isLast && ''
      )}
    >
      <div className="flex items-center gap-x-sm flex-1 min-w-0">
        <UserRound className="size-2xl" />

        <div className="flex flex-col flex-1 min-w-0">
          <div className="elytro-text-bold-body" title={contact.address}>
            <ShortedAddress
              address={contact.address}
              showChainIcon={false}
              hideTooltip
              className="!bg-transparent !p-0"
            />
          </div>
          <p className="elytro-text-tiny-body text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
            {contact.label || 'No label'}
          </p>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">{rightContent}</div>
    </div>
  );
}
