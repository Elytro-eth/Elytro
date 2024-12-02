import CopyableText from '@/components/CopyableText';
import { formatAddressToShort } from '@/utils/format';
import { Chain } from 'viem';

export default function Account({
  address,
  chain,
}: {
  address: TAccountInfo['address'];
  chain: Chain;
}) {
  return (
    <div className="flex flex-row gap-2 items-center ">
      {/* <img
        className="w-10 h-10"
        src={
          SUPPORTED_CHAIN_ICON_MAP[
            chainType as keyof typeof SUPPORTED_CHAIN_ICON_MAP
          ]
        }
      /> */}
      <div className="flex flex-col justify-center">
        <div className="text-xl font-medium text-gray-900">{chain.name}</div>
        {address ? (
          <CopyableText
            className="text-sm text-gray-500"
            text={formatAddressToShort(address)}
            originalText={address}
          />
        ) : null}
      </div>
    </div>
  );
}
