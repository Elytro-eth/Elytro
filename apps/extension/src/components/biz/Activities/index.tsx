import EmptyTip from '@/components/ui/EmptyTip';
import { useAccount } from '@/contexts/account-context';
import ActivityGroup from './Group';
import { UserOperationHistory } from '@/constants/operations';

export default function Activities() {
  const { history } = useAccount();

  if (!history.length)
    return (
      <div className="flex mt-10">
        <EmptyTip tip="No activities yet" />
      </div>
    );

  const historiesByMonth = history.reduce(
    (acc, item) => {
      const date = new Date(item.timestamp);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const key = `${year}/${month}`;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, UserOperationHistory[]>
  );

  Object.values(historiesByMonth).forEach((items) => {
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  const sortedMonths = Object.entries(historiesByMonth).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-y-lg">
      {sortedMonths.map(([month, items]) => (
        <ActivityGroup key={month} date={month} items={items} />
      ))}
    </div>
  );
}
