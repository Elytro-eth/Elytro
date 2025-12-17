import { UserOperationHistory } from '@/constants/operations';
import ActivityItem from './Item';

export default function ActivityGroup({ date, items }: { date: string; items: UserOperationHistory[] }) {
  return (
    <div className="flex flex-col">
      <div className="elytro-text-small text-gray-600 px-lg py-xs">{date}</div>
      {items.map((item) => (
        <ActivityItem key={item.txHash || item.opHash} {...item} />
      ))}
    </div>
  );
}
