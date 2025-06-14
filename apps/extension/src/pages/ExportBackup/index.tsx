import Guide from '@/components/biz/Guide';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HelperText from '@/components/ui/HelperText';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/PasswordInputer';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { writeFile } from '@/utils/file';
import { formatErrorMsg } from '@/utils/format';
import { navigateTo } from '@/utils/navigation';
import dayjs from 'dayjs';
import { Clock, DownloadIcon, Shield, WalletCards } from 'lucide-react';
import { useState } from 'react';

const tips = [
  {
    title: '1. You’ll get a backup file for each wallet',
    description: 'Includes its Social Recovery contacts',
    Icon: WalletCards,
  },
  {
    title: '2. It’s locked with your device passcode',
    description: 'Only you can unlock it later',
    Icon: Shield,
  },
  {
    title: '3. Use it to import on a new device',
    description: 'Import and unlock with the same passcode',
    Icon: Clock,
  },
];

export default function ExportBackupPage() {
  const [isGuiding, setIsGuiding] = useState(true);
  const [pwd, setPwd] = useState('');
  const [isPwdPassed, setIsPwdPassed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { wallet } = useWallet();
  const [isTermOneChecked, setIsTermOneChecked] = useState(false);
  const [isTermTwoChecked, setIsTermTwoChecked] = useState(false);

  const handleGuiding = () => {
    setIsGuiding(false);
  };

  const handlePwdChange = (value: string) => {
    setPwd(value);
    setIsPwdPassed(value.length >= 6 && /[A-Z]/.test(value));
  };

  const handleCreateBackup = async () => {
    try {
      const isValid = await wallet.validatePassword(pwd);
      if (!isValid) {
        toast({
          title: 'Invalid passcode',
          variant: 'destructive',
        });
        return;
      }
      setIsDownloading(true);
    } catch (error) {
      toast({
        title: 'Failed to create backup',
        variant: 'destructive',
        description: formatErrorMsg(error),
      });
      setIsDownloading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backup = await wallet.exportOwnerAndAccounts(pwd);
      const date = dayjs().format('YYYY-MM-DD-HH-mm');
      writeFile(backup, `${date}-elytro-backup.json`);
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
      toast({
        title: 'Backup file is downloaded to your device',
        description: 'You can find it in the Downloads folder',
        variant: 'constructive',
      });
    } catch (error) {
      toast({
        title: 'Failed to export backup',
        variant: 'destructive',
        description: formatErrorMsg(error),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SecondaryPageWrapper title="Export backup">
      {isGuiding ? (
        <Guide title="How wallet backup works" action="Start backup" onAction={handleGuiding} tips={tips} />
      ) : (
        <div className="flex flex-col gap-y-lg items-center h-full justify-between">
          <div className="flex flex-col w-full">
            <div className="elytro-text-bold-body">Create a protected backup</div>
            <div className="elytro-text-smaller-body text-gray-600">Use your device passcode to lock the file</div>
          </div>
          <PasswordInput
            placeholder="Enter your device passcode"
            style={{ border: '1px solid #e2e2e2', background: '#fff' }}
            outerPwdVisible
            value={pwd}
            onValueChange={handlePwdChange}
          />
          <HelperText description="This passcode will be required to unlock your backup file" />
          <Button className="w-full" disabled={!isPwdPassed} onClick={handleCreateBackup}>
            {isPwdPassed ? 'Prepare file' : 'Encrypt file'}
          </Button>

          <Dialog open={isDownloading} onOpenChange={setIsDownloading}>
            <DialogContent className="gap-y-lg max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Locked backup is ready</DialogTitle>
                <DialogDescription>Confirm below to download the file</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-y-sm">
                <div className="flex items-center gap-x-sm" onClick={() => setIsTermOneChecked((prev) => !prev)}>
                  <Checkbox checked={isTermOneChecked} />
                  <Label className="elytro-text-small-body text-gray-600">
                    I need this device passcode to unlock backup
                  </Label>
                </div>
                <div className="flex items-center gap-x-sm" onClick={() => setIsTermTwoChecked((prev) => !prev)}>
                  <Checkbox checked={isTermTwoChecked} />
                  <Label className="elytro-text-small-body text-gray-600">I will not share this file with anyone</Label>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!isTermOneChecked || !isTermTwoChecked}
                onClick={handleDownloadBackup}
              >
                <DownloadIcon className="w-4 h-4 mr-2 stroke-white" /> Download backup
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </SecondaryPageWrapper>
  );
}
