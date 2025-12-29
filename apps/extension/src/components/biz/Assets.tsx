import { useAccount } from '@/contexts/account-context';
import EmptyAsset from '@/components/ui/EmptyAsset';
import TokenItem from '@/components/ui/TokenItem';

const LoadingSkeleton = () => (
  <div className="space-y-4 px-4 mt-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="w-full flex items-center gap-3"
        style={{
          animation: 'pulse 1s ease-in-out infinite',
          animationDelay: `${index * 200}ms`,
        }}
      >
        <div className="size-10 rounded-full bg-gray-150 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-8 bg-gray-150 rounded-sm w-full" />
        </div>
      </div>
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
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
