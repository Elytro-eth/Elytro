import Guide from '@/components/biz/Guide';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { ArrowLeft, Laptop, Lock, WalletCards } from 'lucide-react';
import { useRef, useState } from 'react';
import WalletImg from '@/assets/wallet.png';
import IconPasscode from '@/assets/passcode.png';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/PasswordInputer';
import { TPasswordEncryptedData } from '@/utils/passworder';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { cn } from '@/utils/shadcn/utils';

const tips = [
  {
    title: '1. You need a backup file',
    description: 'Exported from another Elytro device',
    Icon: WalletCards,
  },
  {
    title: '2. Use the lock passcode to unlock',
    description: 'This will also become your passcode on this device',
    Icon: Lock,
  },
  {
    title: '3. Import all your wallets',
    description: 'Do not share backup file with anyone',
    Icon: Laptop,
  },
];

export default function ImportBackup() {
  const [isGuiding, setIsGuiding] = useState(true);
  const [pwd, setPwd] = useState('');
  const [isPwdPassed, setIsPwdPassed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { wallet } = useWallet();
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const handleGuiding = () => {
    setIsGuiding(false);
  };

  const handlePwdChange = (value: string) => {
    setPwd(value);
    setIsPwdPassed(value.length >= 6 && /[A-Z]/.test(value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleStartImport = async () => {
    try {
      const data = JSON.parse(fileContent) as TPasswordEncryptedData;
      if (data.data === undefined || data.iv === undefined || data.salt === undefined) {
        throw new Error('Invalid file content');
      }

      const decrypted = await wallet.importWallet(data, pwd);
      if (decrypted) {
        toast({
          title: 'Import success',
          variant: 'constructive',
        });
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
    } catch (error) {
      toast({
        title: 'Failed to validate passcode',
        variant: 'destructive',
        description: formatErrorMsg(error),
      });
    }
  };

  if (isGuiding) {
    return (
      <SecondaryPageWrapper title="Import Wallets">
        <Guide img={WalletImg} title="How import works" action="Start import" onAction={handleGuiding} tips={tips} />
      </SecondaryPageWrapper>
    );
  }

  return (
    <div className={'w-full min-h-full elytro-gradient-bg-2 p-3xl'}>
      <div className="flex flex-col flex-grow w-full min-h-full rounded-sm">
        <div className="flex flex-row items-center justify-center relative pb-lg mb-sm">
          <ArrowLeft className="elytro-clickable-icon absolute left-0" onClick={() => history.back()} />
          <h3 className="elytro-text-bold-body">Import Wallets</h3>
        </div>
      </div>

      <div className="flex flex-col gap-y-2xl">
        <img src={IconPasscode} alt="Passcode" width={144} className="mx-auto" />
        <h1 className="elytro-text-title text-center">Import all wallets</h1>

        <div className="flex flex-col gap-y-sm w-full max-w-full min-w-full">
          <div className="flex justify-between  items-center bg-white rounded-2xl p-4 h-14 shadow-sm w-full max-w-md">
            <span className={cn('font-medium max-w-36 truncate', !fileName && 'text-gray-600 font-normal')}>
              {fileName || 'Wallet backup file'}
            </span>
            <Label className="ml-4 cursor-pointer" htmlFor="wallet-backup-file">
              <Button
                variant="secondary"
                className="min-w-[100px]"
                size="small"
                onClick={() => inputRef.current?.click()}
              >
                Select file
              </Button>
              <Input
                ref={inputRef}
                id="wallet-backup-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
          </div>
          <PasswordInput placeholder="Passcode to unlock backup" value={pwd} onValueChange={handlePwdChange} />

          <div className="flex flex-row  gap-x-sm cursor-pointer" onClick={() => setIsChecked((prev) => !prev)}>
            <Checkbox className="flex-shrink-0 mt-1" checked={isChecked} />
            <Label className="text-sm text-gray-750 ">
              I understand this passcode will also unlock Elytro on this device. I can change it later.
            </Label>
          </div>
        </div>

        <Button className="w-full" disabled={!isChecked || !isPwdPassed || !fileContent} onClick={handleStartImport}>
          Start import
        </Button>
      </div>
    </div>
  );
}
