import FragmentedAddress from './FragmentedAddress';
const ENSInfo = ({ ensInfo }: { ensInfo: TRecentAddress }) => {
  if (!ensInfo || !ensInfo.address) return null;
  return (
    <div className="flex items-center">
      {ensInfo.avatar ? (
        <img
          src={ensInfo.avatar}
          alt={ensInfo.name}
          className="w-8 h-8 rounded-full mr-2"
        />
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center font-bold justify-center text-white bg-blue mr-2">
          {ensInfo.name ? ensInfo.name[0].toUpperCase() : ''}
        </div>
      )}
      <div className="text-base">
        <div>{ensInfo.name}</div>
        <div className="text-xs font-normal">
          <FragmentedAddress address={ensInfo?.address} />
        </div>
      </div>
    </div>
  );
};
export default ENSInfo;
