import { QRCodeSVG } from 'qrcode.react';
import FragmentedAddress from './FragmentedAddress';

interface IReceiveProps {
  address: string;
  chainId: number;
}

export default function ReceiveAddressBadge({
  address,
  chainId,
}: IReceiveProps) {
  return (
    <div className="px-2xl py-[50px] bg-light-green rounded-lg flex flex-col items-center gap-y-2xl w-full">
      <QRCodeSVG className="mix-blend-multiply" value={address} size={205} />

      <FragmentedAddress
        address={address}
        chainId={chainId}
        size="lg"
        dotColor="#B5D6BA"
      />
    </div>
  );
}
