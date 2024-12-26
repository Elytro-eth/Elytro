// import DailyActivities from './DailyActivities';
import EmptyTip from '@/components/EmptyTip';
import { useAccount } from '../../contexts/account-context';
import { formatAddressToShort } from '@/utils/format';
import { formatEther } from 'viem';
import dayjs from 'dayjs';
import {
  UserOperationHistory,
  UserOperationStatusEn,
} from '@/constants/operations';
import { useEffect, useState } from 'react';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';

const History = ({
  opHash,
  status = UserOperationStatusEn.pending,
  from,
  to,
  value,
  method,
  name,
  timestamp,
}: UserOperationHistory) => {
  const [latestStatus, setLatestStatus] = useState(status);

  const updateStatusFromMessage = (response: SafeObject) => {
    setLatestStatus(response?.status || UserOperationStatusEn.pending);
  };

  useEffect(() => {
    RuntimeMessage.onMessage(
      `${EVENT_TYPES.HISTORY.ITEM_STATUS_UPDATED}_${opHash}`,
      updateStatusFromMessage
    );

    return () => {
      RuntimeMessage.offMessage(updateStatusFromMessage);
    };
  }, [opHash]);

  const StatusMap = {
    [UserOperationStatusEn.confirmedSuccess]: (
      <div className="text-green-800">Success</div>
    ),
    [UserOperationStatusEn.confirmedFailed]: (
      <div className="text-red-800">Failed</div>
    ),
    [UserOperationStatusEn.pending]: (
      <div className="text-yellow-600">Pending</div>
    ),
  };

  const getActivityName = () => {
    if (name) return name;
    if (method?.name) return method.name;
    if (to) return 'Send';
    return 'Unknown Activity';
  };

  return (
    <div className="py-2">
      <div className="flex justify-between">
        <div className="text-lg font-bold">{getActivityName()}</div>

        {value && (
          <div className="text-lg font-medium">
            {formatEther(BigInt(value))} ETH
          </div>
        )}
      </div>
      <div>
        <div className="mt-2">
          {from && (
            <div className="text-gray-400">
              From: {formatAddressToShort(from)}
            </div>
          )}
          {to && (
            <div className="text-gray-400">To: {formatAddressToShort(to)}</div>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        {StatusMap[latestStatus]}
        <div className="text-gray-400">
          {dayjs(timestamp).format('YYYY/MM/DD HH:mm:ss')}
        </div>
      </div>
    </div>
  );
};

export default function Activities() {
  const { history } = useAccount();

  if (!history.length)
    return (
      <div className="flex min-h-[50vh] items-center">
        <EmptyTip tip="You don’t have any activities yet" />
      </div>
    );

  return (
    <div className="flex-1 overflow-auto px-4">
      {/* TODO: now the history may be duplicated, need to fix it. use random key to avoid it. change the key to opHash after fix it. */}
      {history.map((item) => (
        <History key={Math.random()} {...item} />
      ))}
    </div>
  );
}
