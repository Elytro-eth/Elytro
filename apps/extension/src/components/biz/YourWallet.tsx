import ShortedAddress from '@/components/ui/ShortedAddress';
import Copy from '@/components/ui/Copy';

interface YourWalletProps {
  address: string;
  chainId?: number;
  className?: string;
}

export default function YourWallet({ address, chainId, className }: YourWalletProps) {
  return (
    <div className={`flex flex-row items-center gap-x-md px-4 py-3 rounded-md bg-gray-50 ${className || ''}`}>
      <span className="elytro-text-small-bold">Your wallet</span>
      <div className="flex flex-row items-center gap-x-2 ml-auto">
        <ShortedAddress address={address} chainId={chainId} className="bg-gray-50" />
        <Copy text={address} size="sm" iconOnly />
      </div>
    </div>
  );
}
