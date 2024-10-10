import useDialogStore from '@/stores/dialog';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { formatAddressToShort } from '@/utils/format';
import Spin from '@/components/Spin';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const LabelValue = ({ label, value }: { label: string; value?: string }) => {
  return (
    <div className="w-full flex items-center justify-between text-sm">
      <div className="text-gray-400 font-medium">{label}</div>
      <div className="text-gray-900">{value || '--'}</div>
    </div>
  );
};

export default function SignTxModal() {
  const [showMore, setShowMore] = useState(false);
  const { isSignTxDialogOpen, closeSignTxDialog, signTxDetail, loading } =
    useDialogStore();

  const handleClose = () => {
    // only allow close inside the dialog
    closeSignTxDialog();
  };

  const handleConfirm = () => {
    console.log('confirm');
    closeSignTxDialog();
  };

  return (
    <Dialog open={isSignTxDialogOpen} modal={false} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col items-center gap-y-6">
        <Spin isLoading={loading} />

        {/* DApp Action Detail */}
        <div className="flex flex-col items-center">
          <img
            className="w-16 h-16 p-2"
            src={signTxDetail?.fromSession?.icon}
            alt="dApp Logo"
          />
          <div className="text-xl font-medium text-gray-900">
            {signTxDetail?.fromSession.name}
          </div>
          <div className="text-sm text-gray-300">
            {signTxDetail?.fromSession.url}
          </div>
        </div>

        {/* Sign Tx Detail */}
        <div className="w-full flex flex-col gap-y-2">
          <LabelValue
            label="Account"
            value={formatAddressToShort(signTxDetail?.userOpDetail.from)}
          />
          <LabelValue
            label="Contract Address"
            value={formatAddressToShort(signTxDetail?.userOpDetail.to)}
          />
          <LabelValue label="Fee" value={signTxDetail?.userOpDetail.fee} />

          {/* TODO: tx detail. implement it later. ux is not ready */}
          <div className="w-full">
            <div className="flex justify-center">
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-gary-500 hover:text-gary-700 text-sm text-center"
              >
                {showMore ? 'Show less' : 'Show more'}
              </button>
            </div>
            {showMore && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md ">
                <pre className="text-xs max-h-24 overflow-y-scroll whitespace-pre-wrap break-words">
                  {signTxDetail?.userOpDetail?.callData}
                </pre>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex w-full mt-auto">
          <div>
            <div className="text-xs text-gray-300 mb-4 border-t border-gray-200">
              <div className="mt-4">
                By confirming, you will allow the smart contract to access your
                fund and make transactions.
              </div>
            </div>
            <div className="flex w-full gap-x-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 rounded-md border border-gray-200"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirm} className="flex-1 rounded-md">
                Confirm
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}