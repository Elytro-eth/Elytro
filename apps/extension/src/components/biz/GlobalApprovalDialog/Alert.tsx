import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import Spin from '@/components/ui/Spin';
import { Button } from '@/components/ui/button';
import { UnsupportedMethod } from '@/background/provider/rpcFlow/checkCallable';
import ErrorIcon from '@/assets/error.svg';
import { DialogFooter } from '@/components/ui/dialog';

export default function Alert() {
  const { approval, reject } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading={true} />;
  }

  const {
    data: { options },
  } = approval;

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  return (
    <div className="flex flex-col gap-6 bg-white text-center">
      <img src={ErrorIcon} alt="error" className="size-16 self-center" />

      <div className="elytro-text-small">
        {(options as UnsupportedMethod).name} failed, {(options as UnsupportedMethod).reason}
      </div>

      <DialogFooter>
        <Button className="w-full " onClick={handleReject}>
          OK
        </Button>
      </DialogFooter>
    </div>
  );
}
