import { useApproval } from '../contexts/approval-context';
import { useAccount } from '../contexts/account-context';
import { useWallet } from '@/contexts/wallet';
import { ethErrors } from 'eth-rpc-errors';
import ConnectionConfirmation from '../components/ConnectConfirmation';
import Spin from '@/components/Spin';

export default function Connect() {
  const wallet = useWallet();
  const { approval, resolve, reject } = useApproval();
  const { currentChain } = useAccount();

  if (!approval || !approval.data) {
    return <Spin isLoading />;
  }

  const {
    data: { dApp },
  } = approval;

  const handleConnect = async () => {
    try {
      await wallet.connectWallet(dApp, currentChain?.id || 1);
      resolve();
    } catch (error) {
      reject(error as Error);
    } finally {
      window.close();
    }
  };

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
    window.close();
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
