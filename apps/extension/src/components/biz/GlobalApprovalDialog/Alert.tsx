import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import { Button, DialogFooter, Spin } from '@elytro/ui';
import { errorSvg } from '@elytro/ui/assets';
import { UnsupportedMethod } from '@/background/provider/rpcFlow/checkCallable';

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
      <img src={errorSvg} alt="error" className="size-16 self-center" />

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
