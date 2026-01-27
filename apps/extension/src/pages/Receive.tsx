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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

/**
 * "Don't remind me again" feature:
 *
 * This feature allows users to skip the network warning dialog after they've acknowledged it once.
 *
 * How it works:
 * 1. User clicks the Copy button -> dialog shows with a checkbox "Don't remind me again"
 * 2. If checkbox is UNCHECKED and user clicks "I understand":
 *    - Address is copied
 *    - Dialog closes
 *    - Next time they click Copy, dialog shows again
 *
 * 3. If checkbox is CHECKED and user clicks "I understand":
 *    - Address is copied
 *    - Preference is saved to localStorage with key 'elytro-receive-dont-remind'
 *    - skipDialog state is set to true
 *    - Next time they click Copy, address is copied directly without showing dialog
 *
 * 4. The preference persists across browser sessions via localStorage
 * 5. User can clear localStorage manually to reset this preference
 */
const STORAGE_KEY = 'elytro-receive-dont-remind';

export default function Receive() {
  const {
    currentAccount: { address, chainId },
  } = useAccount();

  const [showDialog, setShowDialog] = useState(false);
  const [triggerCopy, setTriggerCopy] = useState(0);
  const [dontRemindAgain, setDontRemindAgain] = useState(false); // Tracks checkbox state in dialog
  const [skipDialog, setSkipDialog] = useState(false); // When true, skip dialog and copy directly

  // On component mount, check if user previously selected "Don't remind me again"
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setSkipDialog(true);
    }
  }, []);

  const handleClose = () => {
    window.history.back();
  };

  // Called when user clicks the Copy button in the green address box
  const handleCopyClick = useCallback(() => {
    if (skipDialog) {
      // User has previously checked "Don't remind me again" - copy directly
      safeClipboard(address, false);
      setTriggerCopy((prev) => prev + 1);
      toast({
        title: 'Address copied',
        variant: 'constructive',
      });
    } else {
      // Show the warning dialog first
      setShowDialog(true);
    }
  }, [skipDialog, address, chainId]);

  // Called when user clicks "I understand" in the dialog
  const handleUnderstand = useCallback(() => {
    if (dontRemindAgain) {
      // Save preference to localStorage and update state to skip dialog in future
      localStorage.setItem(STORAGE_KEY, 'true');
      setSkipDialog(true);
    }
    // Copy the address to clipboard
    safeClipboard(address, false);
    setShowDialog(false);
    setTriggerCopy((prev) => prev + 1); // Trigger the "Copied" state in the button
    toast({
      title: 'Address copied',
      variant: 'constructive',
    });
  }, [address, dontRemindAgain]);

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
        <Button className="w-full" onClick={handleClose}>
          I’m done
        </Button>
      </div>

      {/* Network Warning Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && setShowDialog(false)}>
        <DialogContent showCloseButton={true} className="p-6">
          <div className="flex flex-col items-center gap-y-4 w-full">
            {/* Chain Icon */}
            <img src={chainIcon} alt={chainName} className="size-20 rounded-full" />

            {/* Title */}
            <div className="elytro-text-bold-body text-center">
              This wallet only accepts tokens on
              <br /> {chainName}
            </div>

            {/* Subtitle */}
            <div className="elytro-text-smaller-body text-gray-600 text-center -mt-2">
              Different network, different address
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={dontRemindAgain} onCheckedChange={(checked) => setDontRemindAgain(checked === true)} />
              <span className="elytro-text-smaller-body text-gray-750">Don&apos;t remind me again</span>
            </label>

            {/* Action Button */}
            <Button variant="default" className="w-full" onClick={handleUnderstand}>
              I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SecondaryPageWrapper>
  );
}
