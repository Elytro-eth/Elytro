import { getIconByChainId } from '@/constants/chains';
import { useAccount } from '@/contexts/account-context';
import { formatAddressToShort } from '@/utils/format';
import { cn } from '@elytro/ui';

interface IProps {
  className?: string;
}

export default function CurrentAddress({ className }: IProps) {
  const { currentAccount } = useAccount();

  const { address, chainId } = currentAccount;

  if (!address || !chainId) return null;

  return (
    <div
      className={cn('elytro-text-xs text-center px-2 py-1 rounded-xs bg-white flex items-center gap-x-sm', className)}
    >
      <img src={getIconByChainId(chainId)} alt="Chain" width={16} className="rounded-full" />
      {formatAddressToShort(address)}
    </div>
  );
}
