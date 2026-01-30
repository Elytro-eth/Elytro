import FragmentedAddress from '../FragmentedAddress';
import { DecodeResult } from '@elytro/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { useAccount } from '@/contexts/account-context';
import { formatTokenAmount, formatDollarBalance } from '@/utils/format';
import { etherIcon } from '@elytro/ui/assets';
import { useMemo } from 'react';

interface IInnerSendingDetailProps {
  decodedUserOp: Nullable<DecodeResult>;
}

export default function InnerSendingDetail({ decodedUserOp }: IInnerSendingDetailProps) {
  const { currentAccount } = useAccount();

  if (!decodedUserOp) {
    return null;
  }

  const transferredTokenInfo = getTransferredTokenInfo(decodedUserOp);

  const { logoURI, symbol, decimals, value } = transferredTokenInfo;
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();

  const [tokenAmount, displayPrice] = useMemo(() => {
    if (!value) return ['--', null];
    const tokenAmount = formatTokenAmount(String(value), decimals);
    const displayPrice = formatDollarBalance(tokenPrices, {
      symbol,
      balance: Number(tokenAmount),
    });
    return [tokenAmount, displayPrice];
  }, [value, decimals, symbol, tokenPrices]);

  return (
    <>
      <div className="flex flex-col items-center gap-y-sm px-lg py-md rounded-md">
        <img
          className="size-16 p-2 rounded-full ring-1 ring-gray-150 bg-white"
          src={logoURI || etherIcon}
          alt={symbol}
        />
        <div className="flex flex-col items-center gap-y-0">
          <span className="elytro-text-bold-body text-2xl font-bold">
            -{tokenAmount} {symbol}
          </span>
          {displayPrice && <span className="text-gray-600 elytro-text-small-body">-{displayPrice}</span>}
        </div>
      </div>

      <div className="elytro-text-bold-body">To</div>

      <FragmentedAddress
        size="md"
        address={decodedUserOp?.to}
        chainId={currentAccount?.chainId}
        className="bg-gray-150 px-lg py-lg rounded-md"
      />
    </>
  );
}
