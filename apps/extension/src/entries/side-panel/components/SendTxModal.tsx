import useDialogStore from '@/stores/dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAccount } from '../contexts/account-context';
import SendTxComponent from '../components/SendTx';
import ElytroIcon from '@/assets/logo.svg';

export default function SendTxModal() {
  const {
    isSendTxDialogOpen,
    closeSendTxDialog,
    txDetail,
    afterSendTxConfirm,
  } = useDialogStore();
  if (!txDetail) return null;
  const handleConfirm = () => {
    afterSendTxConfirm();
  };

  const dapp = {
    icon: ElytroIcon,
    name: 'Elytro',
    url: 'https://elytro.io',
  };

  const { currentChain } = useAccount();

  return (
    <Dialog open={isSendTxDialogOpen} modal={false}>
      <DialogContent showCloseButton={false} className="p-0">
        <SendTxComponent
          txParams={txDetail}
          dapp={dapp}
          chainName={currentChain?.name as string}
          onConfirm={handleConfirm}
          onCancel={closeSendTxDialog}
        />
      </DialogContent>
    </Dialog>
  );
}
