import { TxRequestTypeEn } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import {
  formatBalance,
  formatDollarBalance,
  formatRawData,
} from '@/utils/format';
import { DecodeResult } from '@elytro/decoder';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/shadcn/utils';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';

const { InfoCardItem, InfoCardList } = InfoCard;

interface IUserOpDetailProps {
  session?: TDAppInfo;
  requestType: TxRequestTypeEn;
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
  requestType,
  calcResult,
  chainId,
  decodedUserOp,
  from,
}: IUserOpDetailProps) {
  const [showRawData, setShowRawData] = useState(false);
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();

  const DetailContent = useMemo(() => {
    switch (requestType) {
      case TxRequestTypeEn.DeployWallet:
        return <ActivateDetail />;

      case TxRequestTypeEn.SendTransaction:
        return <InnerSendingDetail decodedUserOp={decodedUserOp} />;

      // case TxRequestTypeEn.ApproveTransaction:
      // TODO: add upgrade contract detail
      default:
        return <ApprovalDetail decodedUserOp={decodedUserOp} />;
    }
  }, [requestType, decodedUserOp]);

  const [gasInETH, gasInDollar] = useMemo(() => {
    if (!calcResult?.gasUsed) {
      return ['--', '--'];
    }

    const gasInETH = formatGasUsed(calcResult?.gasUsed);
    const gasInDollar = formatDollarBalance(tokenPrices, {
      balance: Number(gasInETH),
      symbol: 'ETH',
    });

    return [gasInETH, gasInDollar];
  }, [calcResult?.gasUsed, tokenPrices]);

  return (
    <div className="flex flex-col w-full gap-y-md">
      {/* DApp Info: no need for sending transaction */}
      <div className="flex flex-col gap-y-sm">{DetailContent}</div>

      {/* UserOp Pay Info */}
      <InfoCardList>
        <InfoCardItem
          label="From wallet"
          content={<FragmentedAddress address={from} chainId={chainId} />}
        />

        {/* Network cost: unit ETH */}
        <InfoCardItem
          label="Network cost"
          content={
            <span className="elytro-text-small-bold text-gray-600 truncate">
              {calcResult?.hasSponsored && (
                <span className="px-xs py-3xs bg-light-green elytro-text-tiny-body mr-sm rounded-xs">
                  Sponsored
                </span>
              )}
              <span
                className={cn({
                  'line-through font-bold text-sm text-gray-600 ':
                    calcResult?.hasSponsored,
                })}
              >
                {gasInETH} ETH
                {gasInDollar && (
                  <span className="elytro-text-small-body text-gray-600 ml-2xs">
                    ({gasInDollar})
                  </span>
                )}
              </span>
            </span>
          }
        />
      </InfoCardList>

      {/* Transaction Raw Data: Only show for approve transaction */}
      {(requestType === TxRequestTypeEn.ApproveTransaction ||
        requestType === TxRequestTypeEn.UpgradeContract) && (
        <div>
          <button
            className="flex items-center justify-center gap-x-2xs elytro-text-tiny-body text-gray-750 mb-sm"
            onClick={() => setShowRawData((prev) => !prev)}
          >
            Raw Data
            {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <pre
            className={`
              elytro-text-code-body text-gray-500 overflow-auto w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs
              transition-opacity whitespace-pre-wrap
              ${showRawData ? 'block' : 'hidden'}
              `}
            style={{ userSelect: 'text' }}
          >
            {formatRawData(decodedUserOp)}
          </pre>
        </div>
      )}
    </div>
  );
}
