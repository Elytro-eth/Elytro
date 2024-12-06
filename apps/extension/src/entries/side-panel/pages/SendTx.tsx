import { useEffect, useState } from 'react';
import SendTxComponent from '../components/SendTx';
import { useAccount } from '../contexts/account-context';
import { useApproval } from '../contexts/approval-context';
import Spin from '@/components/Spin';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';

export default function SendTx() {
  const { currentChain } = useAccount();
  const { approval, reject, resolve } = useApproval();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (approval?.data?.tx) {
      setLoading(false);
    }
  }, [approval]);

  if (!approval || !approval.data?.tx) {
    return <Spin isLoading={loading} />;
  }

  const handleConfirm = async () => {
    // todo: what to do when tx is sent?
    setTimeout(() => {
      resolve();
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    }, 200);
  };

  const handleCancel = () => {
    reject();
    toast({
      title: 'Success',
      description: 'Transaction sent successfully',
    });

    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="max-w-screen-sm h-full flex py-4">
        <SendTxComponent
          txParams={approval.data.tx[0]}
          dapp={approval.data.dApp}
          chainName={currentChain?.name as string}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <Spin isLoading={loading} />
      </div>
    </div>
  );
}
