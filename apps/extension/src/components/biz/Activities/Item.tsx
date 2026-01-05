import { useEffect } from 'react';
import { HistoricalActivityTypeEn, UserOperationHistory } from '@/constants/operations';
import { UserOperationStatusEn } from '@/constants/operations';
import { useState } from 'react';
import { EVENT_TYPES } from '@/constants/events';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { formatAddressToShort } from '@/utils/format';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronsLeftRight,
  Check,
  ShieldQuestion,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useChain } from '@/contexts/chain-context';
import TokenBalanceItem from '../TokenBalanceItem';

const ActivityTypeMap = {
  [HistoricalActivityTypeEn.Send]: {
    name: 'Send',
    IconComponent: ArrowUpRight,
    bg: 'bg-light-blue',
  },
  [HistoricalActivityTypeEn.Receive]: {
    name: 'Receive',
    IconComponent: ArrowDownLeft,
    bg: 'bg-light-green',
  },
  [HistoricalActivityTypeEn.ActivateAccount]: {
    name: 'Activate Wallet',
    IconComponent: Check,
    bg: 'bg-light-brown',
  },
  [HistoricalActivityTypeEn.ContractInteract]: {
    name: 'Contract Interaction',
    IconComponent: ChevronsLeftRight,
    bg: 'bg-light-brown',
  },
};

const UnknownActivity = {
  name: 'Unknown Activity',
  IconComponent: ShieldQuestion,
  bg: 'bg-light-brown',
};

const ActivityStatusMap = {
  [UserOperationStatusEn.confirmedSuccess]: {
    label: 'Success',
    style: 'hidden',
  },
  [UserOperationStatusEn.confirmedFailed]: {
    label: 'Failed',
    style: 'bg-red',
  },
  [UserOperationStatusEn.pending]: {
    label: 'Pending',
    style: 'bg-blue',
  },
};

export default function ActivityItem({
  txHash,
  opHash,
  status = UserOperationStatusEn.pending,
  from,
  to,
  type,
  decimals,
  value,
  symbol,
  // logoURI,
}: UserOperationHistory) {
  const { openExplorer } = useChain();

  const [latestStatus, setLatestStatus] = useState(status);

  const updateStatusFromMessage = (response: SafeObject) => {
    setLatestStatus(response?.status || UserOperationStatusEn.pending);
  };

  useEffect(() => {
    RuntimeMessage.onMessage(`${EVENT_TYPES.HISTORY.ITEM_STATUS_UPDATED}_${opHash}`, updateStatusFromMessage);

    return () => {
      RuntimeMessage.offMessage(updateStatusFromMessage);
    };
  }, [opHash]);

  const { name, IconComponent, bg } = type ? ActivityTypeMap[type] : UnknownActivity;
  const { label, style } = ActivityStatusMap[latestStatus];
  return (
    <div
      className="group flex items-center w-full justify-between px-lg cursor-pointer py-md rounded-sm hover:bg-gray-50 gap-x-sm min-w-0"
      onClick={() => openExplorer({ txHash, opHash })}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <IconComponent className={`size-8 p-2 ${bg} rounded-full flex-shrink-0`} />

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block font-bold text-base truncate">{name}</span>
            <SquareArrowOutUpRight className="hidden group-hover:block size-3 stroke-gray-600 flex-shrink-0" />
            <span className={`elytro-text-tiny-body px-xs py-3xs rounded-xs text-white ${style} flex-shrink-0`}>
              {label}
            </span>
          </div>

          <span className="elytro-text-tiny-body text-gray-600 truncate">
            {type === HistoricalActivityTypeEn.Receive
              ? `from ${formatAddressToShort(from)}`
              : `to ${formatAddressToShort(to)}`}
          </span>
        </div>
      </div>

      {/* TODO: Check this logic */}
      {(type === HistoricalActivityTypeEn.Send || type === HistoricalActivityTypeEn.Receive || Number(value) > 0) && (
        <TokenBalanceItem
          amount={Number(value)}
          decimals={decimals}
          symbol={symbol}
          address={from as `0x${string}`}
          className="flex-shrink-0"
        />
      )}
    </div>
  );
}
