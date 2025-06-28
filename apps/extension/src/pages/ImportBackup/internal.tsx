import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { ArrowLeft } from 'lucide-react';
import IconPasscode from '@/assets/passcode.png';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/PasswordInputer';
import { TPasswordEncryptedData } from '@/utils/passworder';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { cn } from '@/utils/shadcn/utils';

export default function InternalImportBackup() {
  const [backupPwd, setBackupPwd] = useState('');
  const [devicePwd, setDevicePwd] = useState('');
  const [isPwdPassed, setIsPwdPassed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { wallet } = useWallet();
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleBackupPwdChange = (value: string) => {
    setBackupPwd(value);
  };

  const handleDevicePwdChange = (value: string) => {
    setDevicePwd(value);
  };

  useEffect(() => {
    const isPwdValid = (pwd: string) => pwd.length >= 6 && /[A-Z]/.test(pwd);
    setIsPwdPassed(isPwdValid(backupPwd) && isPwdValid(devicePwd));
  }, [backupPwd, devicePwd]);

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

      const decrypted = await wallet.getImportedWalletsData(data, backupPwd);

      if (decrypted) {
        await wallet.setImportedWalletsData(decrypted, devicePwd);
        toast({
          title: 'Import success',
          variant: 'constructive',
        });
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
    } catch (error) {
      toast({
        title: 'Passcode not correct',
        variant: 'destructive',
        description: formatErrorMsg(error),
      });
    }
  };

  return (
    <div className={'w-full min-h-full elytro-gradient-bg-2 p-xl pt-8'}>
      <div className="flex flex-col flex-grow w-full min-h-full rounded-sm">
        <div className="flex flex-row items-center justify-center relative pb-lg mb-sm">
          <ArrowLeft className="elytro-clickable-icon absolute left-0" onClick={() => history.back()} />
        </div>
      </div>

      <div className="flex flex-col gap-y-2xl">
        <img src={IconPasscode} alt="Passcode" width={144} className="mx-auto" />
        <h1 className="elytro-text-title text-center">Import all wallets</h1>

        <div className="flex flex-col gap-y-sm w-full max-w-full min-w-full">
          <div className="flex justify-between  items-center bg-white rounded-2xl p-4 h-14 w-full max-w-md">
            <span
              className={cn(
                'max-w-36 truncate text-gray-600 font-normal text-lg',
                !fileName && 'text-gray-600 font-normal'
              )}
            >
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
          <PasswordInput
            placeholder="Passcode to unlock backup"
            value={backupPwd}
            onValueChange={handleBackupPwdChange}
          />
          <PasswordInput
            placeholder="Passcode for this device"
            value={devicePwd}
            onValueChange={handleDevicePwdChange}
          />
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
