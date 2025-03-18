import { QRCodeSVG } from 'qrcode.react';
import FragmentedAddress from './FragmentedAddress';
import { EIP3770_CHAIN_PREFIX_MAP } from '@/constants/chains';

interface IReceiveProps {
  address: string;
  chainId: number;
}

export default function ReceiveAddressBadge({
  address,
  chainId,
}: IReceiveProps) {
  const chainPrefix = EIP3770_CHAIN_PREFIX_MAP[chainId];
  const addressWithChainPrefix = chainPrefix
    ? `${chainPrefix}:${address}`
    : address;

  return (
    <div className="px-2xl py-[50px] bg-light-green rounded-lg flex flex-col items-center gap-y-2xl w-full">
      <QRCodeSVG
        className="mix-blend-multiply"
        value={addressWithChainPrefix}
        size={205}
      />

      <FragmentedAddress
        address={address}
        chainId={chainId}
        size="lg"
        dotColor="#B5D6BA"
      />
    </div>
  );
}
