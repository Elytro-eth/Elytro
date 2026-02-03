import { QRCodeSVG } from 'qrcode.react';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { EIP3770_CHAIN_PREFIX_MAP } from '@/constants/chains';
import { Copy, Check } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';

interface IReceiveProps {
  address: string;
  chainId: number;
  onCopyClick?: () => void;
  triggerCopy?: number;
}

export default function ReceiveAddressBadge({ address, chainId, onCopyClick, triggerCopy }: IReceiveProps) {
  const chainPrefix = EIP3770_CHAIN_PREFIX_MAP[chainId];
  const addressWithChainPrefix = chainPrefix ? `${chainPrefix}:${address}` : address;

  const [isCopied, setIsCopied] = useState(false);

  const onCopy = useCallback(() => {
    if (onCopyClick) {
      onCopyClick();
    }
  }, [onCopyClick]);

  useEffect(() => {
    if (triggerCopy && triggerCopy > 0) {
      setIsCopied(true);
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [triggerCopy]);

  return (
    <div className="px-2xl py-4xl bg-green-300 rounded-lg flex flex-col items-center gap-y-2xl w-full">
      <QRCodeSVG className="mix-blend-multiply" value={addressWithChainPrefix} size={205} />

      <ShortedAddress
        address={address}
        chainId={chainId}
        size="lg"
        dotColor="#BCE1A6"
        className="!bg-transparent !p-0"
        rightExtra={
          <button
            onClick={onCopy}
            className="px-3 py-1.5 rounded-md bg-[#BCE1A6] hover:bg-[#BCE1A6] transition-colors flex items-center gap-1.5 ml-sm"
          >
            {isCopied ? (
              <>
                <Check className="size-3 stroke-blue-750" />
                <span className="text-blue-750 text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3 stroke-blue-750" />
                <span className="text-blue-750 text-xs">Copy</span>
              </>
            )}
          </button>
        }
      />
    </div>
  );
}
