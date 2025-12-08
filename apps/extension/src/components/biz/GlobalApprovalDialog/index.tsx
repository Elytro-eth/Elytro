import { useApproval } from '@/contexts/approval-context';
import { useTx } from '@/contexts/tx-context';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ApprovalTypeEn } from '@/constants/operations';
import { useEffect, useState } from 'react';
import Connect from './Connect';
import Chain from './Chain';
import Sign from './Sign';
import Tx from './Tx';
import Alert from './Alert';

export default function GlobalApprovalDialog() {
  const { approval } = useApproval();
  const { requestType } = useTx();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (approval || requestType) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [approval, requestType]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setOpen(false);
    }
  };

  if (!approval && !requestType) return null;

  const renderContent = () => {
    if (approval) {
      const { type } = approval;
      switch (type) {
        case ApprovalTypeEn.Connect:
          return <Connect />;
        case ApprovalTypeEn.ChainChange:
          return <Chain />;
        case ApprovalTypeEn.Sign:
          return <Sign />;
        case ApprovalTypeEn.TxConfirm:
          return <Tx />;
        case ApprovalTypeEn.Alert:
          return <Alert />;

        default:
          return <div>Unknown approval type: {type}</div>;
      }
    }

    if (requestType) {
      return <Tx />;
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        className="!fixed !top-4 !left-4 !right-4 !w-auto !max-w-none !translate-x-0 !translate-y-0 h-auto max-h-[80vh] overflow-y-auto data-[state=open]:!slide-in-from-top-[5%] data-[state=open]:!slide-in-from-left-0"
      >
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
