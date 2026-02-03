import { useAccount } from '@/contexts/account-context';
import { cn } from '@elytro/ui';
import ShortedAddress from '@/components/ui/ShortedAddress';

interface IProps {
  className?: string;
}

export default function CurrentAddress({ className }: IProps) {
  const { currentAccount } = useAccount();

  const { address, chainId } = currentAccount;

  if (!address || !chainId) return null;

  return (
    <div className={cn('elytro-text-xs text-center px-2 py-1 rounded-xs bg-white flex items-center', className)}>
      <ShortedAddress address={address} chainId={chainId} hideTooltip className="!bg-transparent !p-0" />
    </div>
  );
}
