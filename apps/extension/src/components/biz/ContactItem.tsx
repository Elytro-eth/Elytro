import { formatAddressToShort } from '@/utils/format';
import { UserRound } from 'lucide-react';
import { cn } from '@elytro/ui';

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
          <p className="elytro-text-bold-body" title={contact.address}>
            {formatAddressToShort(contact.address)}
          </p>
          <p className="elytro-text-tiny-body text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
            {contact.label || 'No label'}
          </p>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">{rightContent}</div>
    </div>
  );
}
