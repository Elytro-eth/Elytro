import dayjs from 'dayjs';
import FragmentedAddress from '../FragmentedAddress';
import ENSInfoComponent from '../ENSInfo';
import { useMemo } from 'react';

interface IRecentAddressItemProps {
  item: TRecentAddress;
  chainId: number;
  onClick: () => void;
}

const RecentAddressItem = ({ item, chainId, onClick }: IRecentAddressItemProps) => {
  if (!item.address || !item.time) return null;

  const time = useMemo(
    () => <div className="text-gray-600 text-xs font-normal">{dayjs(item.time).fromNow()}</div>,
    [item.time]
  );

  return (
    <div
      onClick={onClick}
      className="px-4 py-md cursor-pointer flex-column items-center justify-between hover:bg-gray-150"
    >
      {item.name ? (
        <ENSInfoComponent ensInfo={item} extra={time} />
      ) : (
        <FragmentedAddress size="md" address={item.address} chainId={chainId} extra={time} />
      )}
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
    <div className="w-full mt-4">
      <div className="elytro-text-smaller-body text-gray-600 font-bold px-4 py-sm">Recent</div>
      <div>
        {recentAddresses.map((item) => (
          <RecentAddressItem key={item.address} item={item} chainId={chainId} onClick={() => onSelectAddress(item)} />
        ))}
      </div>
    </div>
  );
};

export default RecentAddressesList;
