import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { formatBalance, formatDollarBalance, formatRawData } from '@/utils/format';
import { useMemo, useState } from 'react';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const { InfoCardItem, InfoCardList } = InfoCard;

interface IUserOpDetailProps {
  session?: TDAppInfo;
  chainId: number;
  from?: string;
}

const formatGasUsed = (gasUsed?: string) => {
  return gasUsed
    ? formatBalance(formatEther(BigInt(gasUsed)), {
        maxDecimalLength: 4,
      }).fullDisplay
    : '--';
};

export function UserOpDetail({ chainId, from }: IUserOpDetailProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [expandSponsorSelector, setExpandSponsorSelector] = useState(false);
  const {
    tokenInfo: { tokenPrices },
  } = useAccount();
  const { requestType, calcResult, decodedDetail, onRetry } = useTx();

  const DetailContent = useMemo(() => {
    switch (requestType) {
      case TxRequestTypeEn.DeployWallet:
        return <ActivateDetail />;

      case TxRequestTypeEn.SendTransaction:
        return <InnerSendingDetail decodedUserOp={decodedDetail?.[0]} />;

      // case TxRequestTypeEn.ApproveTransaction:
      // TODO: add upgrade contract detail
      default:
        return <ApprovalDetail decodedUserOp={decodedDetail} />;
    }
  }, [requestType, decodedDetail]);

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
        <InfoCardItem label="From wallet" content={<FragmentedAddress address={from} chainId={chainId} />} />

        {/* Network cost: unit ETH */}
        <InfoCardItem
          label="Network cost"
          content={
            <span
              className="flex items-center elytro-text-small truncate"
              onClick={() => {
                setExpandSponsorSelector((prev) => !prev);
              }}
            >
              {calcResult?.hasSponsored ? (
                <span className="px-xs py-3xs bg-light-green elytro-text-tiny-body rounded-xs">Sponsored</span>
              ) : (
                <span className="px-xs text-sm text-gray-750">
                  {gasInETH} ETH
                  {gasInDollar && <span className="elytro-text-small-body text-gray-600 ml-2xs">({gasInDollar})</span>}
                </span>
              )}
              {expandSponsorSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          }
        />
        {expandSponsorSelector && (
          <div>
            <RadioGroup
              value={calcResult?.hasSponsored ? 'sponsor' : 'self'}
              onValueChange={(value: string) => {
                onRetry(value !== 'sponsor');
              }}
              className="flex flex-col gap-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sponsor" id="gas-fee-by-sponsor" />
                <Label
                  htmlFor="gas-fee-by-sponsor"
                  className="flex items-center elytro-text-small-body text-gray-750 truncate"
                >
                  Sponsored by Elytro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self" id="gas-fee-by-self" />
                <Label
                  htmlFor="gas-fee-by-self"
                  className="flex items-center elytro-text-small-body text-gray-750 truncate"
                >
                  <span className="text-gray-750">
                    {gasInETH} ETH
                    {gasInDollar && (
                      <span className="elytro-text-small-body text-gray-600 ml-2xs">({gasInDollar})</span>
                    )}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </InfoCardList>

      {/* Transaction Raw Data: Only show for approve transaction */}
      {(requestType === TxRequestTypeEn.ApproveTransaction || requestType === TxRequestTypeEn.UpgradeContract) && (
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
            {formatRawData(decodedDetail)}
          </pre>
        </div>
      )}
    </div>
  );
}
