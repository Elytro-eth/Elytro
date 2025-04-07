import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import Spin from '@/components/ui/Spin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoWithCircle from '@/assets/error.svg';

export default function BlockedAlert() {
  const { approval, reject } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading={true} />;
  }

  const {
    data: { dApp, options },
  } = approval;

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  return (
    <div className="w-full h-full bg-white flex justify-center items-center min-h-screen p-4">
      <Card className="w-full h-full flex flex-col justify-between border-none rounded-none shadow-none">
        <CardContent className="flex flex-col p-6 text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-16 h-16 left-4 z-10 rounded-full">
              <AvatarImage src={LogoWithCircle} alt={`${dApp.name} icon`} />
              <AvatarFallback>{dApp.name}</AvatarFallback>
            </Avatar>
            <Avatar className="w-16 h-16 z-0 rounded-full mr-4">
              <AvatarImage src={dApp.icon} alt={`${dApp.name} icon`} />
              <AvatarFallback>{dApp.name}</AvatarFallback>
            </Avatar>
          </div>
          <div className="mb-6">
            <div className="elytro-text-body font-bold mb-2">
              Connect to App
            </div>
            <div className="elytro-text-tiny-body text-gray-600">
              {dApp.origin}
            </div>
          </div>
          <div className="elytro-text-small">
            Can’t connect to this app. <br />
            {options?.reason || 'Unknown reason'}
          </div>
          <Button className="flex-1 mt-10" onClick={handleReject}>
            OK
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
