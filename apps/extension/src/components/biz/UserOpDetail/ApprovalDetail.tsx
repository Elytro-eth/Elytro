import { DecodeResult } from '@soulwallet/decoder';
import SessionCard from '../SessionCard';
import InfoCard from '../InfoCard';
import TokenAmountItem from '../TokenAmountItem';
import FragmentedAddress from '../FragmentedAddress';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { useApproval } from '@/contexts/approval-context';
import { UserOpType } from '@/contexts/tx-context';

const { InfoCardItem, InfoCardList } = InfoCard;

interface IApprovalDetailProps {
  session?: TDAppInfo;
  decodedUserOp: Nullable<DecodeResult>;
}

export default function ApprovalDetail({
  decodedUserOp,
}: IApprovalDetailProps) {
  const { approval } = useApproval();

  if (!decodedUserOp) {
    return null;
  }

  const transferredTokenInfo = getTransferredTokenInfo(decodedUserOp);

  return (
    <>
      <SessionCard
        session={
          approval?.type === UserOpType.ApproveTransaction
            ? approval?.data?.dApp
            : undefined
        }
      />
      <InfoCardList>
        <InfoCardItem
          label="Sending"
          content={<TokenAmountItem {...transferredTokenInfo} size="sm" />}
        />

        <InfoCardItem
          label="Contract"
          content={
            <FragmentedAddress
              address={decodedUserOp?.to}
              chainId={decodedUserOp?.toInfo?.chainId}
              showChainIcon={false}
            />
          }
        />

        <InfoCardItem
          label="Function"
          content={
            decodedUserOp?.method?.text || (
              <span className="elytro-text-tiny-body bg-white px-xs py-3xs rounded-xs text-gray-750">
                Unknown
              </span>
            )
          }
        />

        <InfoCardItem label="Data" content={decodedUserOp?.method?.bytes4} />
      </InfoCardList>
    </>
  );
}
