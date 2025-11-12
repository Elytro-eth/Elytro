import TokenAmountItem from '../TokenAmountItem';
import FragmentedAddress from '../FragmentedAddress';
import { DecodeResult } from '@elytro/decoder';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { useAccount } from '@/contexts/account-context';

interface IInnerSendingDetailProps {
  decodedUserOp: Nullable<DecodeResult>;
}

export default function InnerSendingDetail({ decodedUserOp }: IInnerSendingDetailProps) {
  const { currentAccount } = useAccount();

  if (!decodedUserOp) {
    return null;
  }

  const transferredTokenInfo = getTransferredTokenInfo(decodedUserOp);

  return (
    <>
      <div className="elytro-text-bold-body">You are sending</div>
      <div className="flex items-center justify-between px-lg py-md rounded-md bg-gray-150 ">
        <TokenAmountItem {...transferredTokenInfo} showPrice />
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
