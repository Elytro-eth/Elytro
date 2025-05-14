import { useApproval } from '@/contexts/approval-context';
import { ethErrors } from 'eth-rpc-errors';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ApprovalTypeEn } from '@/constants/operations';
import BlockedAlert from './BlockedAlert';
import ChainChange from './ChainChange';
import TxConfirm from './TxConfirm';

export default function ApprovalDialog() {
  const { approval, reject } = useApproval();

  if (!approval || !approval.data) {
    return null;
  }

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  const renderContent = () => {
    switch (approval.type) {
      case ApprovalTypeEn.TxConfirm:
        return <TxConfirm />;
      case ApprovalTypeEn.Alert:
        return <BlockedAlert />;
      case ApprovalTypeEn.ChainChange:
        return <ChainChange />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => handleReject()}>
      <DialogContent showCloseButton={false}>
        <div className="flex flex-col gap-6 py-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
