import Guide from '@/components/biz/Guide';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useWallet } from '@/contexts/wallet';
import { formatErrorMsg } from '@/utils/format';
import { ArrowLeft, Laptop, Lock, WalletCards } from 'lucide-react';
import { bgPasscodeSm, bgWalletTop } from '@elytro/ui/assets';
import { useState, useRef } from 'react';
import { Input, Checkbox, Label, Button, toast, cn } from '@elytro/ui';
import PasswordInput from '@/components/ui/PasswordInputer';
import { TPasswordEncryptedData } from '@/utils/passworder';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';

const tips = [
  {
    title: '1. You need a backup file',
    description: '',
    Icon: WalletCards,
  },
  {
    title: '2. Use lock passcode to unlock',
    description: '',
    Icon: Lock,
  },
  {
    title: '3. You can import multiple wallets',
    description: '',
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
      const data = fileContent ? (JSON.parse(fileContent) as TPasswordEncryptedData) : null;
      if (!data || !data.data || !data.iv || !data.salt) {
        throw new Error('Invalid backup file');
      }

      const decrypted = await wallet.importWallet(data, pwd);
      if (decrypted) {
        toast({
          title: 'Import success',
          variant: 'constructive',
        });
        wallet.lock();
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }
    } catch (error) {
      let description = formatErrorMsg(error);
      if (description.includes('not valid JSON')) {
        description = 'Invalid backup file';
      }
      toast({
        title: 'Incorrect passcode',
        variant: 'destructive',
        description,
      });
    }
  };

  if (isGuiding) {
    return (
      <SecondaryPageWrapper title="Import wallets" isGuide={true}>
        <Guide
          imgSrc={bgWalletTop}
          title="How Import works"
          action="Start import"
          onAction={handleGuiding}
          tips={tips}
        />
      </SecondaryPageWrapper>
    );
  }

  return (
    <div className={'w-full min-h-full elytro-gradient-bg-2 p-xl pt-8'}>
      <div className="flex flex-col flex-grow w-full min-h-full rounded-sm">
        <div className="flex flex-row items-center justify-center relative pb-lg mb-sm">
          <ArrowLeft className="elytro-clickable-icon absolute left-0" onClick={() => history.back()} />
        </div>
      </div>

      <div className="flex flex-col gap-y-2xl">
        <img src={bgPasscodeSm} alt="Passcode" width={200} className="mx-auto mt-20" />
        <h1 className="elytro-text-title text-center">Import wallets</h1>

        <div className="flex flex-col gap-y-sm w-full max-w-full min-w-full">
          <div className="flex justify-between  items-center bg-white rounded-2xl p-4 h-14 w-full min-w-sm">
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
                className="min-w-[100px] w-full"
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
            value={pwd}
            onValueChange={handlePwdChange}
            style={{ backgroundColor: 'white' }}
          />

          <div className="flex flex-row  gap-x-sm cursor-pointer" onClick={() => setIsChecked((prev) => !prev)}>
            <Checkbox className="flex-shrink-0 mt-1" checked={isChecked} />
            <Label className="text-sm text-gray-750 cursor-pointer">
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
