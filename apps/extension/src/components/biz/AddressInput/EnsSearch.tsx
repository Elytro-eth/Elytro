import Spin from '@/components/ui/Spin';
import ENSInfoComponent from '../ENSInfo';

interface IENSSearchResultsProps {
  value: string;
  ensInfo: TRecentAddress | null;
  loading: boolean;
  onSelectENS: () => void;
}

const ENSSearchResults = ({
  value,
  ensInfo,
  loading,
  onSelectENS,
}: IENSSearchResultsProps) => {
  if (!value.endsWith('.eth') && !ensInfo && !loading) return null;

  return (
    <div>
      <div className="elytro-text-smaller-body text-gray-600 font-bold mt-xs px-lg py-sm">
        ENS Search
      </div>
      <div className="relative ">
        {<Spin isLoading={loading} />}
        {ensInfo?.name && (
          <div
            className="cursor-pointer hover:bg-gray-150 px-lg py-md"
            onClick={onSelectENS}
          >
            <ENSInfoComponent ensInfo={ensInfo} />
          </div>
        )}
        {!loading && !ensInfo && value.endsWith('.eth') && (
          <div className="px-lg text-gray-500 text-center">
            No ENS found for &quot;{value}&quot;
          </div>
        )}
      </div>
    </div>
  );
};

export default ENSSearchResults;
