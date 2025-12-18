import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther, formatUnits } from 'viem';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { formatBalance, formatDollarBalance, formatRawData } from '@/utils/format';
import { useMemo, useState } from 'react';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, Copy, AlertCircle } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import HelperText from '@/components/ui/HelperText';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { safeClipboard } from '@/utils/clipboard';
import { RawData } from '@/components/ui/rawData';
import { cn } from '@/utils/shadcn/utils';

const { InfoCardItem, InfoCardList } = InfoCard;

const formatGasUsed = (gasUsed?: string) => {
  const gasUsedNumber = gasUsed ? BigInt(gasUsed) : 0n;
  const tempRes = formatBalance(formatEther(gasUsedNumber), {
    maxDecimalLength: 4,
  }).fullDisplay;

  if (Number(tempRes) < 0.0000001) {
    return '<0.0000001';
  }
  return tempRes;
};

export function UserOpDetail() {
  const [expandSponsorSelector, setExpandSponsorSelector] = useState(false);
  const {
    tokenInfo: { tokenPrices },
    currentAccount: { isDeployed, address, chainId },
  } = useAccount();
  const {
    requestType,
    costResult,
    decodedDetail,
    hasSufficientBalance,
    hookError,
    gasPaymentOption,
    gasOptions,
    onGasOptionChange,
  } = useTx();

  const gasOption =
    gasPaymentOption.type === 'sponsor'
      ? 'sponsor'
      : gasPaymentOption.type === 'self'
        ? 'self'
        : gasPaymentOption.type === 'erc20'
          ? gasPaymentOption.token.token
          : 'self';

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
    // const gasInETH = formatGasUsed(costResult?.gasUsed);
    const self = gasOptions.find((opt) => opt.option.type === 'self');

    console.log('gasOptions', gasOptions);
    if (!self) {
      return ['--', '--'];
    }

    const gasInETH = formatGasUsed(self?.gasUsed);
    const gasInDollar = formatDollarBalance(tokenPrices, {
      balance: Number(gasInETH?.replace('<', '')),
      symbol: 'ETH',
    })?.replace('$', '');

    return [gasInETH, gasInDollar];
  }, [gasOptions, tokenPrices]);

  const getOptionLabel = (option: GasOptionEstimate) => {
    if (option.option.type === 'sponsor') {
      return 'Sponsored by Elytro';
    } else if (option.option.type === 'self') {
      return `${formatGasUsed(option.gasUsed)} ETH${gasInDollar ? ` ($${Number(gasInDollar).toFixed(4)})` : ''}`;
    } else if (option.option.type === 'erc20') {
      const token = option.option.token;
      const gasUsed = BigInt(option.gasUsed);
      const gasInToken = gasUsed;
      return `${formatUnits(gasInToken, token.decimals)} ${token.symbol.toUpperCase()}`;
    }
    return 'Unknown option';
  };

  const getOptionValue = (option: GasOptionEstimate) => {
    if (option.option.type === 'sponsor') return 'sponsor';
    if (option.option.type === 'self') return 'self';
    return option.option.token.token; // ERC20 token address
  };

  const handleGasOptionChange = (value: string) => {
    const matchedOption = gasOptions.find((opt) => {
      if (value === 'sponsor') return opt.option.type === 'sponsor';
      if (value === 'self') return opt.option.type === 'self';
      return opt.option.type === 'erc20' && opt.option.token.token === value;
    });

    if (matchedOption) {
      onGasOptionChange(matchedOption.option);
    }
  };

  if (!costResult) {
    return null;
  }

  if (hookError) {
    return (
      <div className="flex flex-col w-full gap-y-md">
        {hookError?.code === 'OTP_REQUIRED' && <div className="flex flex-col gap-y-sm">test</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-y-md">
      {/* DApp Info: no need for sending transaction */}
      <div className="flex flex-col gap-y-sm">{DetailContent}</div>

      {/* UserOp Pay Info */}
      <InfoCardList>
        <InfoCardItem label="From wallet" content={<FragmentedAddress address={address} chainId={chainId} />} />

        {/* Network cost: unit ETH */}
        <InfoCardItem
          label="Network cost"
          content={
            <button
              type="button"
              className="flex items-center elytro-text-small truncate cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setExpandSponsorSelector((prev) => !prev);
              }}
              aria-label={expandSponsorSelector ? 'Collapse gas payment options' : 'Expand gas payment options'}
              aria-expanded={expandSponsorSelector}
            >
              {gasOption === 'sponsor' && (
                <span className="px-xs py-3xs bg-light-green elytro-text-tiny-body rounded-xs">Sponsored</span>
              )}
              {gasOption === 'self' && (
                <span className="px-xs text-xs text-gray-600">
                  {gasInETH} ETH
                  {gasInDollar && (
                    <span className="elytro-text-small-body text-gray-600 ml-2xs">
                      (${Number(gasInDollar).toFixed(4)})
                    </span>
                  )}
                </span>
              )}
              {gasOption.startsWith('0x') && (
                <span className="px-xs text-xs text-gray-750">
                  {(() => {
                    const erc20Option = gasOptions.find(
                      (opt) => opt.option.type === 'erc20' && opt.option.token.token === gasOption
                    );
                    if (!erc20Option || erc20Option.option.type !== 'erc20') return '';
                    const token = erc20Option.option.token;
                    return `${formatUnits(BigInt(erc20Option.gasUsed), token.decimals)} ${token.symbol.toUpperCase()}`;
                  })()}
                </span>
              )}
              <ChevronUp
                size={16}
                aria-hidden="true"
                className={cn(expandSponsorSelector && 'rotate-180 duration-200 ease-in-out transition-all')}
              />
            </button>
          }
        />
        {expandSponsorSelector && (
          <div role="radiogroup" aria-label="Gas payment options">
            <RadioGroup
              value={gasOption}
              onValueChange={(value: string) => {
                handleGasOptionChange(value);
              }}
              className="flex flex-col gap-y-2"
            >
              {gasOptions.map((option, index) => {
                const value = getOptionValue(option);
                const label = getOptionLabel(option);

                return (
                  <div key={`${option.option.type}-${index}`} className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value={value} id={`gas-fee-${value}`} />
                    <Label
                      htmlFor={`gas-fee-${value}`}
                      className="flex items-center elytro-text-small text-gray-750 truncate cursor-pointer"
                    >
                      <span className="text-gray-750">{label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {!hasSufficientBalance && (
          <div className="bg-light-blue rounded-sm p-3">
            <div className="flex flex-row items-center gap-1 text-red mb-2">
              <AlertCircle className="size-4 text-red stroke-dark-red" />
              <span className="elytro-text-small-body text-dark-red">Not enough for network cost, deposit first</span>
            </div>
            <div className="bg-white rounded-sm px-2 py-1 flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-1 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => safeClipboard(address)}
                aria-label="Copy wallet address"
              >
                <ShortedAddress address={address} chainId={chainId} className="bg-white" />
                <Copy className="size-3 stroke-gray-600" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </InfoCardList>

      {!isDeployed && requestType !== TxRequestTypeEn.DeployWallet && (
        <HelperText description="Wallet activation included with a one-time cost" />
      )}

      {(requestType === TxRequestTypeEn.ApproveTransaction || requestType === TxRequestTypeEn.UpgradeContract) && (
        <RawData>{formatRawData(decodedDetail)}</RawData>
      )}
    </div>
  );
}
