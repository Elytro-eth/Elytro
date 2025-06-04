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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoWithCircle from '@/assets/logoWithCircle.svg';

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
      title: 'Signing cancelled',
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
          <Avatar className="size-5xl mt-10 z-10 rounded-full">
            <AvatarImage src={LogoWithCircle} alt="Elytro" />
            <AvatarFallback>Elytro</AvatarFallback>
          </Avatar>
          <span className="elytro-text-bold-body">You’re almost ready</span>
          <p className="text-sm text-gray-600 -mt-4">
            Activating confirms your wallet<br />onchain and make it ready to use.
          </p>
          <Button onClick={activateNow} disabled={isSending} className="w-full rounded-md">
            Activate now
          </Button>
        </div>
        <Spin isLoading={isSending} />
      </SecondaryPageWrapper>
    );
  }

  const handleConfirm = async (signature: string) => {
    resolve(signature);

    toast({
      title: 'Sign successfully',
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
