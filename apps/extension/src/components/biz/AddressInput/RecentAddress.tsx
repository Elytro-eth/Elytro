import dayjs from 'dayjs';
import FragmentedAddress from '../FragmentedAddress';
import ENSInfoComponent from '../ENSInfo';

interface IRecentAddressItemProps {
  item: TRecentAddress;
  chainId: number;
  onClick: () => void;
}

const RecentAddressItem = ({
  item,
  chainId,
  onClick,
}: IRecentAddressItemProps) => {
  if (!item.address || !item.time) return null;
  const hour = dayjs().diff(item.time, 'h');

  return (
    <div
      onClick={onClick}
      className="px-lg py-md cursor-pointer flex items-center justify-between hover:bg-gray-150"
    >
      {item.name ? (
        <ENSInfoComponent ensInfo={item} />
      ) : (
        <FragmentedAddress size="md" address={item.address} chainId={chainId} />
      )}
      <div className="text-gray-600 text-xs font-normal">
        {hour > 1 ? `${hour}hrs` : 'An hr'} ago
      </div>
    </div>
  );
};

const RecentAddressesList = ({
  recentAddresses,
  chainId,
  onSelectAddress,
}: {
  recentAddresses: TRecentAddress[];
  chainId: number;
  onSelectAddress: (item: TRecentAddress) => void;
}) => {
  if (!recentAddresses.length) return null;

  return (
    <div className="w-full">
      <div className="elytro-text-smaller-body text-gray-600 font-bold mt-xs px-lg py-sm">
        Recent
      </div>
      <div>
        {recentAddresses.map((item) => (
          <RecentAddressItem
            key={item.address}
            item={item}
            chainId={chainId}
            onClick={() => onSelectAddress(item)}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentAddressesList;
