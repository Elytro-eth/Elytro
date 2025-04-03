import LaunchImg from '@/assets/launch.png';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/PasswordInputer';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/wallet';
import { WalletStatusEn } from '@/background/walletController';
import Spin from '@/components/ui/Spin';
import { useApproval } from '@/contexts/approval-context';

interface ContentMapItem {
  title: string;
  iconImg: string;
  content: React.ReactNode;
}

const UnlockComponent = () => {
  const { wallet } = useWallet();
  const { reject } = useApproval();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!password || password.length < 7) return;

    setIsLoading(true);
    try {
      const locked = await wallet.unlock(password);
      if (locked) {
        throw new Error('Invalid password');
      }
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } catch (error) {
      toast({
        title: 'Failed to unlock wallet',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      reject();
    } finally {
      setIsLoading(false);
    }
  }, [password, wallet, reject]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && password.length >= 7) {
        handleUnlock();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUnlock, password]);

  return (
    <div className="flex flex-col gap-y-3xl">
      <PasswordInput
        onValueChange={setPassword}
        placeholder="Enter your passcode"
        disabled={isLoading}
        autoFocus
      />
      <Button
        onClick={handleUnlock}
        disabled={!password || password.length < 7 || isLoading}
      >
        {isLoading ? 'Unlocking...' : 'Unlock'}
      </Button>
    </div>
  );
};

const contentMap: Record<WalletStatusEn, ContentMapItem | null> = {
  [WalletStatusEn.Recovering]: null,
  [WalletStatusEn.NoAccount]: null,
  [WalletStatusEn.HasAccountAndUnlocked]: null,
  [WalletStatusEn.HasAccountButLocked]: {
    title: 'Welcome back!',
    iconImg: LaunchImg,
    content: <UnlockComponent />,
  },
  [WalletStatusEn.NoOwner]: {
    title: 'Your permanent Ethereum client',
    iconImg: LaunchImg,
    content: (
      <div className="flex flex-col gap-y-3">
        <Button
          size="large"
          onClick={() =>
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode)
          }
        >
          Get Started
        </Button>
        <Button
          size="large"
          variant="secondary"
          onClick={() =>
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Transfer)
          }
        >
          Already have a wallet
        </Button>
      </div>
    ),
  },
};

export default function Launch() {
  const { status } = useWallet();

  const renderContent = useMemo(() => {
    if (status === WalletStatusEn.Recovering) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.AccountRecovery);
      return null;
    }

    if (status === WalletStatusEn.NoAccount) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateAccount);
      return null;
    }

    if (status === WalletStatusEn.HasAccountAndUnlocked) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
      return null;
    }

    return contentMap[status];
  }, [status]);

  if (!renderContent) return <Spin isLoading />;

  const { title, content, iconImg } = renderContent;

  return (
    <div className="elytro-gradient-bg flex flex-1 flex-col items-center px-xl h-full gap-y-3xl pt-10">
      <img src={iconImg} alt="Launch" className="size-[128px] mt-10" />
      <h1 className="elytro-text-headline text-center">{title}</h1>
      <div className="flex flex-col w-full">{content}</div>
    </div>
  );
}
