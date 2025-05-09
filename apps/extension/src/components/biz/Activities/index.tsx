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

  // split histories into YYYY/MM
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
  return (
    <div className="flex flex-col gap-y-lg">
      {Object.entries(historiesByMonth).map(([month, items]) => (
        <ActivityGroup key={month} date={month} items={items} />
      ))}
    </div>
  );
}
