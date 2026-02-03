import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import InfoCard from '@/components/biz/InfoCard';
import { formatEther, formatUnits } from 'viem';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { formatBalance, formatDollarBalance, formatRawData } from '@/utils/format';
import { useMemo, useState, useEffect } from 'react';
import ActivateDetail from './ActivationDetail';
import InnerSendingDetail from './InnerSendingDetail';
import ApprovalDetail from './ApprovalDetail';
import { ChevronUp, RefreshCw, Copy as CopyIcon, Check } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';
import { RadioGroup, RadioGroupItem, Button, cn, HelperText } from '@elytro/ui';
import { RawData } from '@/components/ui/rawData';
import { safeClipboard } from '@/utils/clipboard';

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
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const {
    tokenInfo: { tokenPrices },
    currentAccount: { isDeployed, address, chainId },
    reloadAccount,
    loading: isAccountLoading,
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

  // Automatically expand dropdown when there's insufficient balance
  useEffect(() => {
    if (!hasSufficientBalance) {
      setExpandSponsorSelector(true);
    }
  }, [hasSufficientBalance]);

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
      <div className="flex flex-col gap-y-md">{DetailContent}</div>

      {/* UserOp Pay Info */}
      <InfoCardList>
        <InfoCardItem
          label="From wallet"
          content={<ShortedAddress address={address} chainId={chainId} className="!bg-transparent !p-0" />}
        />

        {/* Network cost: unit ETH */}
        <InfoCardItem
          label="Network cost"
          content={
            <button
              type="button"
              className="flex items-center elytro-text-small truncate cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setExpandSponsorSelector((prev: boolean) => !prev);
              }}
              aria-label={expandSponsorSelector ? 'Collapse gas payment options' : 'Expand gas payment options'}
              aria-expanded={expandSponsorSelector}
            >
              {gasOption === 'sponsor' && (
                <span className="px-xs py-3xs bg-green-300 elytro-text-tiny-body rounded-xs">Sponsored</span>
              )}
              {gasOption === 'self' && (
                <span className="px-xs text-xs text-gray-600">
                  {gasInETH} ETH
                  {gasInDollar && (
                    <span className="elytro-text-small-body text-gray-600 ml-2xs">
                      (${Number(gasInDollar).toFixed(2)})
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
          <RadioGroup
            value={gasOption}
            onValueChange={(value: string) => {
              handleGasOptionChange(value);
            }}
            className="mt-2 flex flex-col gap-y-2"
            aria-label="Gas payment options"
          >
            {gasOptions
              .filter((option) => option.option.type === 'sponsor' || option.option.type === 'self')
              .map((option) => {
                const value = getOptionValue(option);
                const isSelected = gasOption === value;
                const isSponsor = option.option.type === 'sponsor';
                const showActions = !isSponsor && isSelected && !hasSufficientBalance;

                return (
                  <div
                    key={`${option.option.type}`}
                    className={cn('w-full rounded-sm', isSelected ? 'bg-white' : 'bg-gray-50')}
                  >
                    <button
                      type="button"
                      onClick={() => handleGasOptionChange(value)}
                      className={cn(
                        'w-full rounded-sm p-3 text-left',
                        'flex items-center gap-3 hover:bg-white',
                        isSelected ? 'bg-white' : 'hover:bg-white',
                        !option.hasSufficientBalance && 'cursor-not-allowed'
                      )}
                      disabled={!option.hasSufficientBalance}
                      aria-pressed={isSelected}
                    >
                      <RadioGroupItem
                        value={value}
                        id={`gas-fee-${value}`}
                        disabled={!option.hasSufficientBalance}
                        className="flex-shrink-0"
                      />
                      <div className="flex flex-col gap-0">
                        {isSponsor ? (
                          <>
                            <span className={cn('elytro-text-small text-gray-900', isSelected && 'font-bold')}>
                              Free
                            </span>
                            <span className="elytro-text-tiny-body text-gray-600">Sponsored by Elytro</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2xs">
                              <span className={cn('elytro-text-small text-gray-900', isSelected && 'font-bold')}>
                                {gasInETH} ETH
                              </span>
                              {!hasSufficientBalance && (
                                <span className="ml-1 px-xs py-3xs bg-red-300 elytro-text-tiny-body rounded-xs text-red-750">
                                  Insufficient
                                </span>
                              )}
                            </div>
                            {gasInDollar && (
                              <span className="elytro-text-tiny-body text-gray-600">
                                ${Number(gasInDollar).toFixed(2)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                    {showActions && (
                      <div className="border-t border-gray-150 flex items-center gap-3 px-3 py-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="tiny"
                          onClick={async () => {
                            await safeClipboard(
                              address,
                              true,
                              () => {
                                setIsCopied(true);
                                setTimeout(() => {
                                  setIsCopied(false);
                                }, 1500);
                              },
                              'Address copied'
                            );
                          }}
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3 stroke-green-600 mr-2" />
                              <span className="elytro-text-xs text-blue-750">Copied</span>
                            </>
                          ) : (
                            <>
                              <CopyIcon className="size-3 stroke-blue-750 mr-2" />
                              <span className="elytro-text-xs text-blue-750">Add funds</span>
                            </>
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsCheckingBalance(true);
                            const startTime = Date.now();
                            const minDuration = 500; // Minimum 500ms to show animation
                            try {
                              await reloadAccount();
                            } finally {
                              const elapsed = Date.now() - startTime;
                              if (elapsed < minDuration) {
                                await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
                              }
                              setIsCheckingBalance(false);
                            }
                          }}
                          disabled={isCheckingBalance || isAccountLoading}
                          className="flex items-center gap-1 ml-auto text-sm text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw
                            className={cn(
                              'size-3 stroke-gray-600',
                              (isCheckingBalance || isAccountLoading) && 'animate-spin'
                            )}
                          />
                          <span className="text-xs text-gray-600 hover:text-gray-750">Check balance</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </RadioGroup>
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
