import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/account-context';
import { toast } from '@/hooks/use-toast';
import { useTx, TxRequestTypeEn } from '@/contexts/tx-context';

export default function ActivateButton() {
  const { currentAccount } = useAccount();
  const { handleTxRequest } = useTx();

  const onClickActivate = async () => {
    try {
      handleTxRequest(TxRequestTypeEn.DeployWallet);
    } catch (error) {
      toast({
        title: 'Activate wallet failed',
        description: (error as Error)?.message,
      });
      console.error(error);
    }
  };

  return (
    <Button onClick={onClickActivate} disabled={!currentAccount}>
      Activate wallet
    </Button>
  );
}
