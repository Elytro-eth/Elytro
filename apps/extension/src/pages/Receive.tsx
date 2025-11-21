import { useAccount } from '@/contexts/account-context';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import ReceiveAddressBadge from '@/components/biz/ReceiveAddressBadge';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spin from '@/components/ui/Spin';
import { getChainNameByChainId, getIconByChainId } from '@/constants/chains';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState, useCallback, useEffect } from 'react';
import { safeClipboard } from '@/utils/clipboard';
import { formatAddress } from '@/utils/format';
import { Checkbox } from '@/components/ui/checkbox';

const STORAGE_KEY = 'elytro-receive-dont-remind';

export default function Receive() {
  const {
    currentAccount: { address, chainId },
  } = useAccount();

  const [showDialog, setShowDialog] = useState(false);
  const [triggerCopy, setTriggerCopy] = useState(0);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [skipDialog, setSkipDialog] = useState(false);

  // Load the preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setSkipDialog(true);
    }
  }, []);

  const handleClose = () => {
    window.history.back();
  };

  const handleCopyClick = useCallback(() => {
    if (skipDialog) {
      // Skip dialog and copy directly
      safeClipboard(formatAddress(address, chainId), false);
      setTriggerCopy((prev) => prev + 1);
    } else {
      setShowDialog(true);
    }
  }, [skipDialog, address, chainId]);

  const handleUnderstand = useCallback(() => {
    if (dontRemindAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setSkipDialog(true);
    }
    safeClipboard(formatAddress(address, chainId), false);
    setShowDialog(false);
    setTriggerCopy((prev) => prev + 1); // Trigger the "Copied" state
  }, [address, chainId, dontRemindAgain]);

  if (!address) {
    return <Spin isLoading />;
  }

  const chainName = getChainNameByChainId(chainId);
  const chainIcon = getIconByChainId(chainId);

  return (
    <SecondaryPageWrapper title="Receive">
      <div className="flex flex-col gap-y-5 items-center w-full relative">
        {/* Chain info */}
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row items-center gap-2  ">
            <img src={chainIcon} alt={chainName} className="size-8 rounded-full border border-gray-50" />
            <div className="flex flex-col">
              <div className="elytro-text-bold-body">Only accepts tokens on {chainName}</div>
              <div className="elytro-text-tiny-body text-gray-600">Copy and send tokens to below address.</div>
            </div>
          </div>

          {/* <ChevronDown
            className="elytro-clickable-icon"
            onClick={handleClickChainSelector}
          /> */}
        </div>

        <ReceiveAddressBadge
          address={address!}
          chainId={chainId}
          onCopyClick={handleCopyClick}
          triggerCopy={triggerCopy}
        />

        <div className="flex flex-row items-center gap-2 w-full text-left">
          <CircleAlert className="elytro-icon stroke-gray-600 size-3" />
          <div className="elytro-text-tiny-body text-gray-600">Tokens sent to other networks will be lost.</div>
        </div>

        {/* Close Button */}
        <Button variant="secondary" size="large" className="w-full" onClick={handleClose}>
          I&apos;m done
        </Button>
      </div>

      {/* Network Warning Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && setShowDialog(false)}>
        <DialogContent showCloseButton={true} className="p-6">
          <div className="flex flex-col items-center gap-y-4 w-full">
            {/* Chain Icon */}
            <img src={chainIcon} alt={chainName} className="size-20 rounded-full" />

            {/* Title */}
            <div className="elytro-text-bold-body text-center">This account only accepts tokens on {chainName}</div>

            {/* Subtitle */}
            <div className="elytro-text-smaller-body text-gray-600 text-center">
              Different network, different address
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={dontRemindAgain} onCheckedChange={(checked) => setDontRemindAgain(checked === true)} />
              <span className="elytro-text-smaller-body text-gray-600">Don&apos;t remind me again</span>
            </label>

            {/* Action Button */}
            <Button variant="default" size="large" className="w-full" onClick={handleUnderstand}>
              I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SecondaryPageWrapper>
  );
}
