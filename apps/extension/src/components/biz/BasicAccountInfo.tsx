import { ArrowDownLeft, ArrowUpRight, Box, Settings2Icon } from 'lucide-react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import ActionButton from './ActionButton';
import { useAccount } from '@/contexts/account-context';
import AccountsDropdown from './AccountsDropdown';
import { RedDot } from '@/components/ui/RedDot';
import { formatAddress } from '@/utils/format';
import { Copy as IconCopy, Check as IconCheck } from 'lucide-react';
import { safeClipboard } from '@/utils/clipboard';
import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getChainNameByChainId, getIconByChainId } from '@/constants/chains';

/**
 * "Don't remind me again" feature for dashboard copy button:
 *
 * This feature allows users to skip the network warning dialog after they've acknowledged it once.
 *
 * How it works:
 * 1. User clicks the Copy icon (next to address) -> dialog shows with a checkbox "Don't remind me again"
 * 2. If checkbox is UNCHECKED and user clicks "I understand":
 *    - Address is copied
 *    - Dialog closes
 *    - "Copied" state shows for 1 second
 *    - Next time they click Copy, dialog shows again
 *
 * 3. If checkbox is CHECKED and user clicks "I understand":
 *    - Address is copied
 *    - Preference is saved to localStorage with key 'elytro-copy-dont-remind'
 *    - skipDialog state is set to true
 *    - Next time they click Copy, address is copied directly without showing dialog
 *
 * 4. The preference persists across browser sessions via localStorage
 * 5. This uses a SEPARATE storage key from the Receive page, so preferences are independent
 * 6. User can clear localStorage manually to reset this preference
 */
const STORAGE_KEY = 'elytro-copy-dont-remind';

const HeaderSection = () => {
  const { currentAccount } = useAccount();
  const [isCopied, setIsCopied] = useState(false); // Shows "Copied" text for 1 second after copy
  const [showDialog, setShowDialog] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false); // Tracks checkbox state in dialog
  const [skipDialog, setSkipDialog] = useState(false); // When true, skip dialog and copy directly

  const chainName = getChainNameByChainId(currentAccount.chainId);
  const chainIcon = getIconByChainId(currentAccount.chainId);

  // On component mount, check if user previously selected "Don't remind me again"
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setSkipDialog(true);
    }
  }, []);

  const handleClickSettings = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Settings);
  };

  const onCopied = useCallback((copyError?: Error) => {
    if (!copyError) {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    }
  }, []);

  // Called when user clicks the Copy icon next to the address
  const handleCopyClick = useCallback(() => {
    if (skipDialog) {
      // User has previously checked "Don't remind me again" - copy directly
      safeClipboard(formatAddress(currentAccount.address, currentAccount.chainId), false, onCopied);
    } else {
      // Show the warning dialog first
      setShowDialog(true);
    }
  }, [skipDialog, currentAccount.address, currentAccount.chainId, onCopied]);

  // Called when user clicks "I understand" in the dialog
  const handleUnderstand = useCallback(() => {
    if (dontRemindAgain) {
      // Save preference to localStorage and update state to skip dialog in future
      localStorage.setItem(STORAGE_KEY, 'true');
      setSkipDialog(true);
    }
    // Copy the address to clipboard (onCopied callback will show "Copied" state)
    safeClipboard(formatAddress(currentAccount.address, currentAccount.chainId), false, onCopied);
    setShowDialog(false);
  }, [currentAccount.address, currentAccount.chainId, dontRemindAgain, onCopied]);

  return (
    <>
      <div className="flex flex-row gap-3 w-full items-center justify-between mb-2">
        <div className="flex flex-row gap-x-md items-center">
          <AccountsDropdown />
          {isCopied ? (
            <div className="flex items-center gap-2">
              <IconCheck className="elytro-icon size-4 stroke-green" />
              <span className="text-green-600">Copied</span>
            </div>
          ) : (
            <IconCopy
              className="elytro-clickable-icon size-4 stroke-gray-600 hover:stroke-gray-900"
              onClick={handleCopyClick}
            />
          )}
        </div>
        <div className="flex flex-row gap-x-md relative">
          <Settings2Icon className="elytro-clickable-icon" onClick={handleClickSettings} />
          {currentAccount.needUpgrade && <RedDot size="normal" className="absolute -right-1 -top-1" />}
        </div>
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
    </>
  );
};

const ActionButtons = () => {
  const { currentAccount } = useAccount();

  const handleClickSend = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.SendTx);
  };

  const handleClickReceive = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
  };

  const handleClickActivateWallet = () => {
    // TODO: Implement activate wallet
  };

  if (currentAccount.isDeployed) {
    return (
      <>
        <ActionButton
          className="bg-light-green hover:bg-green hover:stroke-white"
          icon={
            <ArrowDownLeft className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />
          }
          label="Receive"
          onClick={handleClickReceive}
        />
        <ActionButton
          className="hover:stroke-white"
          icon={
            <ArrowUpRight className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />
          }
          label="Send"
          onClick={handleClickSend}
        />
      </>
    );
  }

  return (
    <ActionButton
      icon={<Box className="size-5 mr-1 stroke-dark-blue duration-100 transition-all group-hover:stroke-white" />}
      label="Activate wallet"
      onClick={handleClickActivateWallet}
    />
  );
};

export default function BasicAccountInfo() {
  const { currentAccount } = useAccount();
  return (
    <div className="flex flex-col p-sm pb-0">
      <HeaderSection />

      {currentAccount.isDeployed && (
        <div className="flex flex-row gap-md my-sm">
          <ActionButtons />
        </div>
      )}
    </div>
  );
}
