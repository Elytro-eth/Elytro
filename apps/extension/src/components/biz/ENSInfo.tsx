import { ReactNode } from 'react';
import FragmentedAddress from './FragmentedAddress';
const ENSInfo = ({ ensInfo, extra }: { ensInfo: TRecentAddress; extra?: ReactNode }) => {
  if (!ensInfo || !ensInfo.address) return null;
  return (
    <div className="flex items-center">
      {ensInfo.avatar ? (
        <img src={ensInfo.avatar} alt={ensInfo.name} className="size-6 rounded-full mr-2" />
      ) : (
        <div className="size-6 rounded-full flex items-center font-bold justify-center text-white bg-green-600 mr-2">
          {ensInfo.name ? ensInfo.name[0].toUpperCase() : ''}
        </div>
      )}
      <div className="text-base font-bold">
        <div>{ensInfo.name}</div>
        <div className="flex text-xs font-normal">
          <FragmentedAddress address={ensInfo?.address} extra={extra} size="xs" />
        </div>
      </div>
    </div>
  );
};
export default ENSInfo;
