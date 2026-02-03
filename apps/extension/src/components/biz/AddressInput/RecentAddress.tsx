import dayjs from 'dayjs';
import ShortedAddress from '@/components/ui/ShortedAddress';
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
      className="px-4 py-md cursor-pointer flex-column items-center justify-between hover:bg-gray-300"
    >
      {item.name ? (
        <ENSInfoComponent ensInfo={item} extra={time} />
      ) : (
        <ShortedAddress
          size="lg"
          address={item.address}
          chainId={chainId}
          bottomExtra={time}
          className="!bg-transparent !p-0"
        />
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
    <div className="w-full mt-2">
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
