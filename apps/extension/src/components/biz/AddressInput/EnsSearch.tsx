import ENSInfoComponent from '../ENSInfo';

interface IENSSearchResultsProps {
  value: string;
  ensInfo: TRecentAddress | null;
  loading: boolean;
  onSelectENS: () => void;
}

const ENSSearchResults = ({ value, ensInfo, loading, onSelectENS }: IENSSearchResultsProps) => {
  if (!value.endsWith('.eth') && !ensInfo && !loading) return null;

  return (
    <div>
      <div className="elytro-text-smaller-body text-gray-600 font-bold mt-xs px-lg py-sm">ENS Search</div>
      <div className="relative ">
        {loading && (
          <div
            className="w-full flex items-center gap-3 px-lg py-md"
            style={{
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            <div className="size-10 rounded-full bg-gray-150 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-8 bg-gray-150 rounded-sm w-full" />
            </div>
          </div>
        )}
        {ensInfo?.name && (
          <div className="cursor-pointer hover:bg-gray-300 px-lg py-md" onClick={onSelectENS}>
            <ENSInfoComponent ensInfo={ensInfo} />
          </div>
        )}
        {!loading && !ensInfo && value.endsWith('.eth') && <div className="px-lg text-gray-600">No ENS found.</div>}
      </div>
    </div>
  );
};

export default ENSSearchResults;
