import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { formatBalance, formatDollarBalance, formatRawData } from '@/utils/format';
import { useEffect, useMemo, useState } from 'react';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, ChevronDown, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import HelperText from '@/components/ui/HelperText';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { safeClipboard } from '@/utils/clipboard';
import { RawData } from '@/components/ui/rawData';
import { useWallet } from '@/contexts/wallet';

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
  const { wallet } = useWallet();
  const [expandSponsorSelector, setExpandSponsorSelector] = useState(false);
  const {
    tokenInfo: { tokenPrices },
    currentAccount: { isDeployed, address },
  } = useAccount();
  const { requestType, calcResult, decodedDetail, onRetry, hasSufficientBalance, useStablecoin } = useTx();
  const [gasOption, setGasOption] = useState<string>(useStablecoin || (calcResult?.hasSponsored ? 'sponsor' : 'self'));
  const [tokenPaymasters, setTokenPaymasters] = useState<TTokenPaymaster[]>([]);

  const DetailContent = useMemo(() => {
    switch (requestType) {
      case TxRequestTypeEn.DeployWallet:
        return <ActivateDetail />;

      case TxRequestTypeEn.SendTransaction:
        return <InnerSendingDetail decodedUserOp={decodedDetail?.[decodedDetail.length - 1]} />;

      // case TxRequestTypeEn.ApproveTransaction:
      // TODO: add update contract detail
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

  const getTokenPaymaster = async () => {
    try {
      const res = await wallet.getTokenPaymaster();
      setTokenPaymasters(res);
    } catch (error) {
      console.error('Elytro: Failed to get token paymaster.', error);
      setTokenPaymasters([]);
    }
  };

  useEffect(() => {
    getTokenPaymaster();
  }, []);

  const handleGasOptionChange = (value: string) => {
    if (value === 'sponsor') {
      onRetry(false);
    } else if (value === 'self') {
      onRetry(true);
    } else {
      onRetry(
        true,
        tokenPaymasters.find((paymaster) => paymaster.address === value)
      );
    }
  };

  useEffect(() => {
    setGasOption(useStablecoin || (calcResult?.hasSponsored ? 'sponsor' : 'self'));
  }, [useStablecoin, calcResult?.hasSponsored]);

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
              {gasOption === 'sponsor' && (
                <span className="px-xs py-3xs bg-light-green elytro-text-tiny-body rounded-xs">Sponsored</span>
              )}
              {gasOption === 'self' && (
                <span className="px-xs text-sm text-gray-750">
                  {gasInETH} ETH
                  {gasInDollar && <span className="elytro-text-small-body text-gray-600 ml-2xs">({gasInDollar})</span>}
                </span>
              )}
              {useStablecoin && (
                <span className="px-xs text-sm text-gray-750">
                  Pay gas with
                  <span className="elytro-text-small-body text-gray-750 ml-2xs">
                    {tokenPaymasters.find((paymaster) => paymaster.address === useStablecoin)?.name}
                  </span>
                </span>
              )}
              {expandSponsorSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          }
        />
        {expandSponsorSelector && (
          <div>
            <RadioGroup
              value={gasOption}
              onValueChange={(value: string) => {
                handleGasOptionChange(value);
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

              {tokenPaymasters.length > 0 &&
                tokenPaymasters.map((paymaster) => (
                  <div key={paymaster.address} className="flex items-center space-x-2">
                    <RadioGroupItem value={paymaster.address} id={paymaster.address} />
                    <Label
                      htmlFor={paymaster.address}
                      className="flex items-center elytro-text-small-body text-gray-600 truncate"
                    >
                      Pay gas with
                      <span className="elytro-text-small-body text-gray-750 ml-2xs">{paymaster.name}</span>
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {!hasSufficientBalance && (
          <div className="bg-light-blue rounded-md p-3">
            <div className="flex flex-row items-center gap-1 text-red mb-1">
              <AlertCircle className="size-4 text-red stroke-dark-red" />
              <span className="elytro-text-small-body text-dark-red">
                Not enough gas fee, please deposit some first
              </span>
            </div>
            <div className="bg-white rounded-md p-2  flex items-center justify-between">
              <div className="flex items-center 1 cursor-pointer" onClick={() => safeClipboard(address)}>
                <ShortedAddress address={address} chainId={chainId} className="bg-white" />
                <Copy className="size-3 stroke-gray-600" />
              </div>
              <div
                className="flex flex-row items-center text-black-blue px-2 py-1 rounded-xs  hover:text-primary hover:bg-primary/10"
                onClick={() => onRetry()}
              >
                <RefreshCw className="size-3 mr-1" />
                Check
              </div>
            </div>
          </div>
        )}
      </InfoCardList>

      {!isDeployed && requestType !== TxRequestTypeEn.DeployWallet && (
        <HelperText description="Wallet activation included with a one-time cost" />
      )}

      {/* Transaction Raw Data: Only show for approve transaction */}
      {(requestType === TxRequestTypeEn.ApproveTransaction || requestType === TxRequestTypeEn.UpgradeContract) && (
        <RawData>{formatRawData(decodedDetail)}</RawData>
      )}
    </div>
  );
}
