import { useEffect, useState } from 'react';
import { useApproval } from '@/contexts/approval-context';
import Spin from '@/components/ui/Spin';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '../routes';
import { navigateTo } from '@/utils/navigation';
import SignDetail from '@/components/biz/SignDetail';
import { useAccount } from '@/contexts/account-context';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useTx, TxRequestTypeEn } from '@/contexts/tx-context';
import { Button } from '@/components/ui/button';

export default function Sign() {
  const {
    currentAccount: { chainId, isDeployed },
  } = useAccount();
  const { approval, reject, resolve } = useApproval();
  const { handleTxRequest, isSending } = useTx();
  const [loading, setLoading] = useState(true);

  const handleCancel = async () => {
    await reject();
    toast({
      title: 'Canceled',
      description: 'Sign canceled',
    });
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  useEffect(() => {
    if (approval?.data?.sign) {
      setLoading(false);
    }
  }, [approval]);

  if (!approval || !approval.data?.sign || !chainId) {
    return <Spin isLoading={loading} />;
  }

  if (!isDeployed) {
    const activateNow = async () => {
      await reject();
      handleTxRequest(TxRequestTypeEn.DeployWallet);
    };

    return (
      <SecondaryPageWrapper title="Activate Wallet" onBack={handleCancel} className="p-md">
        <div className="flex flex-col items-center gap-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            Your smart wallet is not activated yet. You need to activate it before signing messages.
          </p>
          <Button onClick={activateNow} disabled={isSending} className="w-full rounded-md">
            Activate Wallet
          </Button>
        </div>
        <Spin isLoading={isSending} />
      </SecondaryPageWrapper>
    );
  }

  const handleConfirm = async (signature: string) => {
    resolve(signature);

    toast({
      title: 'Success',
      description: 'Sign successfully',
    });
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
