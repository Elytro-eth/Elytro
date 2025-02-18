import LaunchImg from '@/assets/launch.png';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/PasswordInputer';
import { useMemo, useState } from 'react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/wallet';
import { WalletStatusEn } from '@/background/walletController';
import Spin from '@/components/ui/Spin';
import { useApproval } from '@/contexts/approval-context';

export default function Launch() {
  const { wallet, status } = useWallet();
  const { resolve, reject } = useApproval();
  const [pwd, setPwd] = useState('');
  const handleUnlock = async () => {
    try {
      const locked = await wallet.unlock(pwd);

      if (locked) {
        throw new Error('Invalid password');
      } else {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
        resolve();
      }
    } catch (error) {
      toast({
        title: 'Oops! Failed to unlock',
        description: (error as Error).message ?? 'Unknown error',
        variant: 'destructive',
      });
      reject();
    }
  };

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

    const contentMap = {
      [WalletStatusEn.HasAccountButLocked]: {
        title: 'Welcome back!',
        iconImg: LaunchImg,
        content: (
          <div className="flex flex-col gap-y-3xl">
            <PasswordInput onValueChange={(pwd) => setPwd(pwd)} />
            <Button onClick={handleUnlock} disabled={!pwd || pwd.length < 7}>
              Unlock
            </Button>
          </div>
        ),
      },
      [WalletStatusEn.NoOwner]: {
        title: 'Your permanent Ethereum client',
        iconImg: LaunchImg,
        content: (
          <>
            {/* TODO: navigate to new create account page */}
            <Button
              size="large"
              onClick={() => {
                navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode);
              }}
            >
              Get Started
            </Button>
            {/* TODO: navigate to import/recover account page */}
            <Button
              size="large"
              variant="secondary"
              onClick={() =>
                // TODO: this is a temporary dev mock: go to recover account page without user's confirmation
                navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Transfer)
              }
            >
              I already have an account
            </Button>
          </>
        ),
      },
    };

    return contentMap[status] || null;
  }, [status, pwd]);

  if (!renderContent) return <Spin isLoading />;

  const { title, content, iconImg } = renderContent;

  return (
    <div className="elytro-gradient-bg flex flex-1 flex-col items-center justify-center px-3xl h-full gap-y-3xl">
      <img src={iconImg} alt="Launch" className="size-[164px]" />
      <h1 className="elytro-text-headline text-center">{title}</h1>
      <div className="flex flex-col w-full">{content}</div>
    </div>
  );
}
