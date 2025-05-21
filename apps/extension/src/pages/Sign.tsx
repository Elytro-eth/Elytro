import { useEffect, useState } from 'react';
import { useApproval } from '@/contexts/approval-context';
import Spin from '@/components/ui/Spin';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';
import SignDetail from '@/components/biz/SignDetail';
import { useAccount } from '@/contexts/account-context';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';

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
    <SecondaryPageWrapper title="Sign" onBack={handleCancel} className="p-0">
      <SignDetail
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        dapp={approval.data.dApp}
        chainId={chainId}
        signData={approval.data.sign}
      />

      <Spin isLoading={loading} />
    </SecondaryPageWrapper>
  );
}
