import { Button } from './button';
import EmptyTip from './EmptyTip';

export default function EmptyAsset() {
  return (
    <EmptyTip tip="No tokens yet">
      <Button className="w-24 h-10 text-gray-900 bg-white border-gray-200 hover:bg-gray-200">
        Deposit
      </Button>
    </EmptyTip>
  );
}
