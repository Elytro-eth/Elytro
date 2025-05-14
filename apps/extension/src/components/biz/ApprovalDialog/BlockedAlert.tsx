import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import Spin from '@/components/ui/Spin';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UnsupportedMethod } from '@/background/provider/rpcFlow/checkCallable';
import ErrorIcon from '@/assets/error.svg';

export default function BlockedAlert() {
  const { approval, reject } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading={true} />;
  }

  const {
    data: { dApp, options },
  } = approval;

  return (
    <div className="flex flex-col gap-y-2xl bg-white text-center">
      {/* DApp Info */}
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarImage src={dApp.icon} alt={`${dApp.name} icon`} />
          <AvatarFallback>{dApp.name}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <div className="elytro-text-body font-bold">{dApp.name}</div>
          <div className="elytro-text-tiny-body text-gray-600">{dApp.origin}</div>
        </div>
      </div>

      <img src={ErrorIcon} alt="error" className="size-16 self-center" />

      <div className="elytro-text-small">
        The Dapp called
        <span className="font-bold  px-xs">{(options as UnsupportedMethod).name}</span>
        failed, the reason is
        <span className=" font-bold  px-xs">{(options as UnsupportedMethod).reason}</span>
      </div>

      <Button className="w-full " onClick={() => reject(ethErrors.provider.userRejectedRequest())}>
        OK
      </Button>
    </div>
  );
}
