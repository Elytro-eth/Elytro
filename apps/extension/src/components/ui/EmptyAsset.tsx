import { Button } from './button';
import EmptyTip from './EmptyTip';

export default function EmptyAsset() {
  return (
    <EmptyTip tip="No tokens yet">
      <Button variant="secondary">Deposit</Button>
    </EmptyTip>
  );
}
