import { useApproval } from '@/contexts/approval-context';
import { useWallet } from '@/contexts/wallet';
import { ethErrors } from 'eth-rpc-errors';
import ConnectionConfirmation from '@/components/biz/ConnectConfirmation';
import Spin from '@/components/ui/Spin';

export default function Connect() {
  const { wallet } = useWallet();
  const { approval, resolve, reject } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading />;
  }

  const {
    data: { dApp },
  } = approval;

  const handleConnect = async () => {
    try {
      await wallet.connectSite(dApp);
      resolve();
    } catch (error) {
      reject(error as Error);
    } finally {
      window.close();
    }
  };

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  return (
    <div className="w-full h-full flex justify-center items-center min-h-screen p-4">
      <ConnectionConfirmation
        dApp={dApp}
        onConfirm={handleConnect}
        onCancel={handleReject}
      />
    </div>
  );
}
