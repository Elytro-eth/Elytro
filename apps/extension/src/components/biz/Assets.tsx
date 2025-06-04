import { useAccount } from '@/contexts/account-context';
import EmptyAsset from '@/components/ui/EmptyAsset';
import { Skeleton } from '@/components/ui/skeleton';
import TokenItem from '@/components/ui/TokenItem';

const LoadingSkeleton = () => (
  <div className="space-y-4 px-4 mt-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="w-full h-10" />
    ))}
  </div>
);

const TokenList = ({ tokens }: { tokens: TTokenInfo[] }) => (
  <div className="flex flex-col">
    {tokens.map((token) => (
      <TokenItem key={`${token.address}-${token.chainId}`} token={token} showSymbol={false} />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex justify-center min-h-[50vh] items-center">
    <EmptyAsset />
  </div>
);

export default function Assets() {
  const {
    tokenInfo: { tokens, loading },
  } = useAccount();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!tokens.length) {
    return <EmptyState />;
  }

  return <TokenList tokens={tokens} />;
}
