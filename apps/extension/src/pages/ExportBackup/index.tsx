import Guide from '@/components/biz/Guide';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { LaptopMinimal, DownloadIcon, LockKeyhole, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import WalletImg from '@/assets/wallet.png';
import { useAccount } from '@/contexts/account-context';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { formatEther } from 'viem';

const tips = [
  {
    title: '1. You can backup multiple wallets',
    description: '',
    Icon: WalletCards,
  },
  {
    title: '2. Backup locked by passcode',
    description: '',
    Icon: LockKeyhole,
  },
  {
    title: '3. You can import on a new device',
    description: '',
    Icon: LaptopMinimal,
  },
];

export default function ExportBackupPage() {
  const { accounts, getAccounts } = useAccount();
  const [isGuiding, setIsGuiding] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [pwd, setPwd] = useState('');
  const [isPwdPassed, setIsPwdPassed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { wallet } = useWallet();
  const [isTermOneChecked, setIsTermOneChecked] = useState(false);
  const [isTermTwoChecked, setIsTermTwoChecked] = useState(false);
  const [isTermThreeChecked, setIsTermThreeChecked] = useState(false);
  const handleGuiding = () => {
    setIsFadingOut(true);
    // Wait for fade-out animation before switching view
    setTimeout(() => {
      setIsGuiding(false);
      setIsFadingOut(false);
    }, 150); // Match animation duration
  };
  const [exportedAccounts, setExportedAccounts] = useState<string[]>(accounts.map((account) => account.address));

  const handlePwdChange = (value: string) => {
    setPwd(value);
    setIsPwdPassed(value.length >= 6 && /[A-Z]/.test(value));
  };

  const handleCreateBackup = async () => {
    try {
      const isValid = await wallet.validatePassword(pwd);
      if (!isValid) {
        toast({
          title: 'Incorrect Passcode',
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
      const backup = await wallet.exportOwnersAndAccounts(pwd, exportedAccounts);
      const date = dayjs().format('YYYY-MM-DD-HH-mm');
      writeFile(backup, `${date}-elytro-backup.json`);
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
      toast({
        title: 'Backup downloaded',
        //description: 'You can find it in the Downloads folder',
        variant: 'constructive',
      });
    } catch {
      toast({
        title: 'Export wallets failed, please try again',
        variant: 'destructive',
        description: '',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleAccount = (address: string) => {
    setExportedAccounts((prev) => {
      if (prev.includes(address)) {
        return prev.filter((addr) => addr !== address);
      }
      return [...prev, address];
    });
  };

  useEffect(() => {
    getAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      setExportedAccounts(accounts.map((account) => account.address));
    }
  }, [accounts]);

  return (
    <SecondaryPageWrapper title="Export wallets">
      {isGuiding ? (
        <div className={`page-fade-in ${isFadingOut ? 'page-fade-out' : ''}`}>
          <Guide
            title="How backup works"
            action="Start backup"
            onAction={handleGuiding}
            tips={tips}
            imgSrc={WalletImg}
          />
        </div>
      ) : (
        <div
          className={`flex flex-col gap-y-lg items-center h-full justify-between page-fade-in ${isFadingOut ? 'page-fade-out' : ''}`}
        >
          <div className="flex flex-col w-full">
            <div className="elytro-text-bold-body">Create a backup</div>
          </div>

          <div className="w-full max-h-32 overflow-y-scroll flex flex-col rounded-md bg-gray-150 p-md">
            {accounts.map((account) => (
              <div key={account.address} className="flex items-center" onClick={() => toggleAccount(account.address)}>
                <Checkbox checked={exportedAccounts.includes(account.address)} />
                <ShortedAddress address={account.address} chainId={account.chainId} />
                <span className="elytro-text-tiny-body text-gray-750">
                  ({formatEther(BigInt(account.balance || 0))} ETH)
                </span>
              </div>
            ))}
          </div>
          <PasswordInput placeholder="Confirm device passcode" value={pwd} onValueChange={handlePwdChange} />
          <HelperText description="Passcode will be required to unlock your backup file" />
          <Button
            className="w-full"
            disabled={!isPwdPassed || exportedAccounts.length === 0}
            onClick={handleCreateBackup}
          >
            {isPwdPassed ? 'Prepare file' : 'Prepare file'}
          </Button>

          <Dialog open={isDownloading} onOpenChange={setIsDownloading}>
            <DialogContent className="gap-y-lg max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Backup is ready</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-y-sm">
                <div className="flex items-start gap-x-sm" onClick={() => setIsTermOneChecked((prev) => !prev)}>
                  <Checkbox checked={isTermOneChecked} />
                  <Label className="elytro-text-small-body text-gray-600 cursor-pointer">
                    Passcode unlocks backup — never share it
                  </Label>
                </div>
                <div className="flex items-start gap-x-sm" onClick={() => setIsTermThreeChecked((prev) => !prev)}>
                  <Checkbox checked={isTermThreeChecked} />
                  <Label className="elytro-text-small-body text-gray-600 cursor-pointer">
                    Backup doesn’t include recovery records
                  </Label>
                </div>
                <div className="flex items-start gap-x-sm" onClick={() => setIsTermTwoChecked((prev) => !prev)}>
                  <Checkbox checked={isTermTwoChecked} />
                  <Label className="elytro-text-small-body text-gray-600 cursor-pointer">
                    New backup needed once recovered with Recovery elsewhere
                  </Label>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!isTermOneChecked || !isTermTwoChecked || !isTermThreeChecked}
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
