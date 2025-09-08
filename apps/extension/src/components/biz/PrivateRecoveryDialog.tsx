import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';
import { useAccount } from '@/contexts/account-context';
import { useWallet } from '@/contexts/wallet';
import { getLocalContactsSetting } from '@/utils/contacts';
import { toast } from '@/hooks/use-toast';
import { writeFile } from '@/utils/file';
import dayjs from 'dayjs';

export default function PrivateRecoveryDialog() {
  const [open, setOpen] = useState(false);
  const { currentAccount } = useAccount();
  const { wallet } = useWallet();

  useEffect(() => {
    const onPrivateReady = () => setOpen(true);
    RuntimeMessage.onMessage(EVENT_TYPES.UI.PRIVATE_RECOVERY_READY, onPrivateReady);
    return () => {
      RuntimeMessage.offMessage(onPrivateReady);
    };
  }, []);

  const handleDownload = async () => {
    const { contacts, threshold } = await getLocalContactsSetting(currentAccount.address);

    const isOnchainContactsChanged = await wallet.checkRecoveryContactsSettingChanged(
      contacts.map((contact) => contact.address),
      Number(threshold)
    );

    if (isOnchainContactsChanged) {
      toast({ title: 'Local records out of sync', description: '' });
      return;
    }

    const date = dayjs().format('YYYY-MM-DD-HH-mm');
    const data = {
      address: currentAccount.address,
      chainId: currentAccount.chainId,
      contacts,
      threshold: String(threshold),
    };
    writeFile(JSON.stringify(data), `${currentAccount.address}-elytro-recovery-contacts-${date}.json`);
    toast({ title: 'Recovery contacts downloaded', description: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Private recovery set</DialogTitle>
          <DialogDescription>Download your recovery file and store it safely.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="small" onClick={() => setOpen(false)}>
            Later
          </Button>
          <Button size="small" onClick={handleDownload}>
            Download file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
