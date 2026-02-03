import { useEffect, useState } from 'react';
import { useApproval } from '@/contexts/approval-context';
import SignDetail from '@/components/biz/SignDetail';
import { useAccount } from '@/contexts/account-context';
import { useTx, TxRequestTypeEn } from '@/contexts/tx-context';
import { Button, Avatar, AvatarFallback, AvatarImage, DialogHeader, DialogTitle, toast, Spin } from '@elytro/ui';
import { logoWithCircleSvg } from '@elytro/ui/assets';

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
      <div>
        <DialogHeader>
          <DialogTitle>Activate Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-y-6 text-center">
          <Avatar className="size-5xl mt-10 z-10 rounded-full">
            <AvatarImage src={logoWithCircleSvg} alt="Elytro" />
            <AvatarFallback>Elytro</AvatarFallback>
          </Avatar>
          <span className="elytro-text-bold-body">You’re almost ready</span>
          <p className="text-sm text-gray-600 -mt-4">
            Activating confirms your wallet
            <br />
            onchain and make it ready to use.
          </p>
          <Button onClick={activateNow} disabled={isSending} className="w-full rounded-md">
            Activate now
          </Button>
        </div>
        <Spin isLoading={isSending} />
      </div>
    );
  }

  const handleConfirm = async (signature: string) => {
    resolve(signature);

    toast({
      title: 'Sign successfully',
    });
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Sign</DialogTitle>
      </DialogHeader>
      <SignDetail
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        dapp={approval.data.dApp}
        chainId={chainId}
        signData={approval.data.sign}
      />

      <Spin isLoading={loading} />
    </div>
  );
}
