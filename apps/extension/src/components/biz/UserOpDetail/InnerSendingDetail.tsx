import TokenAmountItem from '../TokenAmountItem';
import FragmentedAddress from '../FragmentedAddress';
import { DecodeResult } from '@soulwallet/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { useChain } from '@/contexts/chain-context';

interface IInnerSendingDetailProps {
  decodedUserOp: Nullable<DecodeResult>;
}

export default function InnerSendingDetail({
  decodedUserOp,
}: IInnerSendingDetailProps) {
  const { currentChain } = useChain();

  if (!decodedUserOp) {
    return null;
  }

  const transferredTokenInfo = getTransferredTokenInfo(decodedUserOp);

  return (
    <>
      <div className="elytro-text-bold-body">You are sending</div>
      <div className="flex items-center justify-between px-lg py-md rounded-md bg-gray-150 ">
        <TokenAmountItem {...transferredTokenInfo} />
        {/* TODO: no token price API. */}
        {/* <span className="elytro-text-smaller-body text-gray-600">--</span> */}
      </div>

      <div className="elytro-text-bold-body">To</div>

      <FragmentedAddress
        size="md"
        address={decodedUserOp?.to}
        chainId={currentChain?.id}
        className="bg-gray-150 px-lg py-md rounded-md"
      />
    </>
  );
}
