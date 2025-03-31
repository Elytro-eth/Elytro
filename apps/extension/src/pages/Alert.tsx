import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import Spin from '@/components/ui/Spin';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <div className="w-full h-full flex justify-center items-center min-h-screen p-4">
      <Card className="w-full h-full flex flex-col justify-between border-none rounded-none shadow-none">
        <CardContent className="flex flex-col p-6 text-center">
          <div className="flex justify-center mb-2">
            <Avatar className="w-16 h-16 z-10 mt-3xl rounded-none">
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
        </CardContent>
        <CardFooter className="flex justify-between space-x-4">
          <Button className="flex-1" onClick={handleReject}>
            OK
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
