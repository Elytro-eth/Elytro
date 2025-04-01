import { Button } from './button';
import EmptyTip from './EmptyTip';

export default function EmptyAsset() {
  return (
    <EmptyTip tip="Your wallet is empty">
      <Button className="w-24 h-10 text-gray-900 bg-white border-gray-200 hover:bg-gray-200">
        Deposit
      </Button>
    </EmptyTip>
  );
}
