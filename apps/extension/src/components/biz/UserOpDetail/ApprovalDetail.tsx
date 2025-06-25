import { DecodeResult } from '@soulwallet/decoder';
import SessionCard from '../SessionCard';
import { getTransferredTokenInfo } from '@/utils/dataProcess';
import { useApproval } from '@/contexts/approval-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

import InfoCard from '../InfoCard';
import TokenAmountItem from '../TokenAmountItem';
import FragmentedAddress from '../FragmentedAddress';

const { InfoCardItem, InfoCardList } = InfoCard;

import { useChain } from '@/contexts/chain-context';

function ContractAddress({ address }: { address: string }) {
  const { currentChain } = useChain();

  return (
    <FragmentedAddress
      className="flex flex-row items-center gap-sm"
      address={address}
      showChainIcon={false}
      extraLayout="row"
      extra={
        <ExternalLink
          className="size-4 cursor-pointer"
          onClick={() =>
            currentChain?.blockExplorers?.default?.url &&
            window.open(`${currentChain?.blockExplorers?.default?.url}/address/${address}`, '_blank')
          }
        />
      }
    />
  );
}

interface IApprovalDetailItemProps {
  decodedResult: DecodeResult;
  defaultExpanded?: boolean;
}

function ApprovalDetailItem({ decodedResult, defaultExpanded = false }: IApprovalDetailItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const transferredTokenInfo = getTransferredTokenInfo(decodedResult);

  return (
    <div className="w-full">
      <InfoCardList>
        <InfoCardItem
          label={<span className="text-black-blue">Contract Interaction</span>
          }
          content={
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-50 rounded transition-colors"
        >
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
          }
        />

        <InfoCardItem label="Contract" content={<ContractAddress address={decodedResult?.to} />} />

        {isExpanded && (
          <>
        <InfoCardItem
          label="Sending"
          content={<TokenAmountItem {...transferredTokenInfo} size="sm" />}
        />

        {decodedResult?.method?.text && (
          <InfoCardItem
            label="Function"
            content={decodedResult?.method?.text}
          />
        )}

        <InfoCardItem
          label="Data"
          content={decodedResult?.method?.bytes4}
        />
          </>
        )}
      </InfoCardList>
    </div>
  );
}

interface IApprovalDetailProps {
  session?: TDAppInfo;
  decodedUserOp: Nullable<DecodeResult[]>;
}

export default function ApprovalDetail({ decodedUserOp }: IApprovalDetailProps) {
  const { approval } = useApproval();

  if (!decodedUserOp) {
    return null;
  }

  return (
    <>
      <SessionCard session={approval?.type === TxRequestTypeEn.ApproveTransaction ? approval?.data?.dApp : undefined} />
      {decodedUserOp.map((item, index) => (
        <ApprovalDetailItem key={index + item.to} decodedResult={item} defaultExpanded={decodedUserOp.length === 1} />
      ))}
    </>
  );
}
