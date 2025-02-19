import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/account-context';
import { toast } from '@/hooks/use-toast';
import { useTx, UserOpType } from '@/contexts/tx-context';

export default function ActivateButton() {
  const { currentAccount } = useAccount();
  const { openUserOpConfirmTx } = useTx();

  const onClickActivate = async () => {
    try {
      // TODO: send userOp to Send Tx Modal
      openUserOpConfirmTx(UserOpType.DeployWallet);
    } catch (error) {
      toast({
        title: 'Activate account failed',
        description: (error as Error)?.message,
      });
      console.error(error);
    }
  };

  return (
    <Button onClick={onClickActivate} disabled={!currentAccount}>
      Activate account
    </Button>
  );
}
