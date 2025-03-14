import { useEffect, useState } from 'react';
import { useApproval } from '@/contexts/approval-context';
import Spin from '@/components/ui/Spin';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';
import SignDetail from '@/components/biz/SignDetail';
import { useAccount } from '@/contexts/account-context';

export default function Sign() {
  const {
    currentAccount: { chainId },
  } = useAccount();
  const { approval, reject, resolve } = useApproval();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (approval?.data?.sign) {
      setLoading(false);
    }
  }, [approval]);

  if (!approval || !approval.data?.sign || !chainId) {
    return <Spin isLoading={loading} />;
  }

  const handleConfirm = async (signature: string) => {
    resolve(signature);

    toast({
      title: 'Success',
      description: 'Sign successfully',
    });
  };

  const handleCancel = () => {
    reject();
    toast({
      title: 'Canceled',
      description: 'Sign canceled',
    });
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="max-w-screen-sm h-full flex py-4">
        <SignDetail
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          dapp={approval.data.dApp}
          chainId={chainId}
          signData={approval.data.sign}
        />

        <Spin isLoading={loading} />
      </div>
    </div>
  );
}
