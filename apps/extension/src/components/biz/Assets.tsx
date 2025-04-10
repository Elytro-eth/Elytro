import { useAccount } from '@/contexts/account-context';
import EmptyAsset from '@/components/ui/EmptyAsset';
import { Skeleton } from '@/components/ui/skeleton';
import TokenItem from '@/components/ui/TokenItem';

export default function Assets() {
  const {
    tokenInfo: { tokens, loading },
  } = useAccount();

  if (loading)
    return (
      <div className="space-y-4 px-4 mt-3">
        <Skeleton className="w-full h-[40px]" />
        <Skeleton className="w-full h-[40px]" />
        <Skeleton className="w-full h-[40px]" />
      </div>
    );

  if (tokens.length > 0)
    return (
      <div className="flex flex-col">
        {tokens.map((item) => {
          return <TokenItem key={item.address + item.chainId} token={item} />;
        })}
      </div>
    );

  return (
    <div className="flex justify-center min-h-[50vh] items-center">
      <EmptyAsset />
    </div>
  );
}
