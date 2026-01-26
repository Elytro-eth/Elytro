import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWallet } from '@/contexts/wallet';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import EnvelopeIcon from '@/assets/envelope.png';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ConfirmPreForceUninstallModal() {
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const [open, setOpen] = useState(false);
  const handlePreForceUninstall = async () => {
    try {
      const txs = await wallet.generatePreForceUninstallSecurityHookTxs();
      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as SafeAny, { noHookSignWith2FA: true });
      setOpen(false);
    } catch (error) {
      console.error('Pre force uninstall SecurityHook failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div
          className="text-center text-sm text-gray-500 mt-4 w-full hover:text-gray-700 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          Lost access to your email?
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign with 2FA</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center w-full text-center gap-y-lg my-4">
          <img src={EnvelopeIcon} alt="envelope" className="size-24" />
          <div className="text-lg font-bold">Reset Sign with 2FA</div>
          <div className="text-sm text-gray-500">
            You’ve lost access to your verification email. <br />
            For security, resetting 2FA takes 3 days.
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handlePreForceUninstall}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
