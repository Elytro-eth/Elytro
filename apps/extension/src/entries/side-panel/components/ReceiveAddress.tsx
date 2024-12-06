import { QRCodeSVG } from 'qrcode.react';
import { safeClipboard } from '@/utils/clipboard';
import { Button } from '@/components/ui/button';
import SplitedGrayAddress from '@/components/SplitedGrayAddress';
import { Address, Chain } from 'viem';

interface IReceiveProps {
  address: string;
  currentChain: Chain;
}

export default function ReceiveAddress({
  address,
  currentChain,
}: IReceiveProps) {
  return (
    <div className="self-center flex flex-col items-center bg-white rounded-3xl p-4  border border-gray-200 max-w-96">
      {/* Chain info */}
      <div className="flex flex-row items-center gap-2 mb-10">
        <div className="flex flex-col">
          <div className="text-lg font-medium">{currentChain.name}</div>
          <div className="text-sm text-gray-500">
            Only send {currentChain.name} assets to this address
          </div>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSVG value={address} size={200} />

      {/* Address */}
      <SplitedGrayAddress
        className="text-sm text-gray-500 my-4"
        address={address as Address}
      />

      {/* Copy Address */}
      <Button className="rounded-full" onClick={() => safeClipboard(address)}>
        Copy Address
      </Button>
    </div>
  );
}
