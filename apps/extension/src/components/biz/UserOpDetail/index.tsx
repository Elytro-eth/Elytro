import { UserOpType } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { formatBalance, formatRawData } from '@/utils/format';
import { DecodeResult } from '@soulwallet/decoder';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/shadcn/utils';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, ChevronDown } from 'lucide-react';

const { InfoCardItem, InfoCardList } = InfoCard;

interface IUserOpDetailProps {
  session?: TDAppInfo;
  opType: UserOpType;
  calcResult: Nullable<TUserOperationPreFundResult>;
  chainId: number;
  decodedUserOp: Nullable<DecodeResult>;
  from?: string;
}

const formatGasUsed = (gasUsed?: string) => {
  return gasUsed
    ? formatBalance(formatEther(BigInt(gasUsed)), {
        maxDecimalLength: 4,
      }).fullDisplay
    : '--';
};

export function UserOpDetail({
  opType,
  calcResult,
  chainId,
  decodedUserOp,
  from,
  session,
}: IUserOpDetailProps) {
  const [showRawData, setShowRawData] = useState(false);

  const DetailContent = useMemo(() => {
    switch (opType) {
      case UserOpType.DeployWallet:
        return <ActivateDetail />;

      case UserOpType.SendTransaction:
        return <InnerSendingDetail decodedUserOp={decodedUserOp} />;

      case UserOpType.ApproveTransaction:
        return (
          <ApprovalDetail session={session} decodedUserOp={decodedUserOp} />
        );

      default:
        return null;
    }
  }, [opType, decodedUserOp]);

  return (
    <div className="flex flex-col w-full gap-y-md">
      {/* DApp Info: no need for sending transaction */}
      <div className="flex flex-col gap-y-sm">{DetailContent}</div>

      {/* UserOp Pay Info */}
      <InfoCardList>
        <InfoCardItem
          label="From account"
          content={<FragmentedAddress address={from} chainId={chainId} />}
        />

        {/* Network cost: unit ETH */}
        <InfoCardItem
          label="Network cost"
          content={
            <span className="elytro-text-small-bold text-gray-600">
              {calcResult?.hasSponsored && (
                <span className="px-xs py-3xs bg-light-green elytro-text-tiny-body mr-sm rounded-xs">
                  Sponsored
                </span>
              )}
              <span
                className={cn({
                  'line-through text-gray-600': calcResult?.hasSponsored,
                })}
              >
                {formatGasUsed(calcResult?.gasUsed)} ETH
              </span>
            </span>
          }
        />
      </InfoCardList>

      {/* Transaction Raw Data: Only show for approve transaction */}
      {opType === UserOpType.ApproveTransaction && (
        <div>
          <button
            className="flex items-center justify-center gap-x-2xs elytro-text-tiny-body text-gray-750 "
            onClick={() => setShowRawData((prev) => !prev)}
          >
            Raw Data
            {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <pre
            className={`
            elytro-text-smaller-body text-gray-500 overflow-auto w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs
            transition-opacity duration-300
            ${showRawData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          >
            {formatRawData(decodedUserOp)}
          </pre>
        </div>
      )}
    </div>
  );
}
