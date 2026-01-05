import { UserOperationHistory } from '@/constants/operations';
import ActivityItem from './Item';

export default function ActivityGroup({ date, items }: { date: string; items: UserOperationHistory[] }) {
  return (
    <div className="flex flex-col px-sm">
      <div className="elytro-text-small text-gray-600 py-xs px-sm">{date}</div>
      {items.map((item) => (
        <ActivityItem key={item.txHash || item.opHash} {...item} />
      ))}
    </div>
  );
}
