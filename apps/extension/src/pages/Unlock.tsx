import { Button } from '@/components/ui/button';

import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

import { useApproval } from '@/contexts/approval-context';
import { useWallet } from '@/contexts/wallet';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import PasswordInput from '@/components/ui/PasswordInputer';
import LaunchImg from '@/assets/launch.png';
import { cn } from '@/utils/shadcn/utils';

const Unlock = () => {
  const { wallet } = useWallet();
  const { reject } = useApproval();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!password || password.length < 7) return;

    setIsLoading(true);
    try {
      const locked = await wallet.unlock(password);
      if (locked) {
        throw new Error('Invalid password');
      }
      // Start fade-out animation, then navigate
      setIsFadingOut(true);
      setTimeout(() => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }, 150); // Match the page-fade-out duration
    } catch (error) {
      toast({
        // title: 'Failed to unlock wallet',
        description: error instanceof Error ? error.message : 'Please try again',
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
    <div
      className={cn(
        'elytro-gradient-bg flex flex-1 flex-col items-center px-xl min-h-screen gap-y-3xl pt-10',
        isFadingOut ? 'page-fade-out' : 'page-fade-in'
      )}
    >
      <img src={LaunchImg} alt="Launch" className="size-[8rem] mt-10" />
      <h1 className="elytro-text-headline text-center">Welcome back</h1>
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-y-3xl">
          <PasswordInput
            className="bg-white"
            onValueChange={setPassword}
            placeholder="Enter your passcode"
            disabled={isLoading}
            autoFocus
          />
          <Button onClick={handleUnlock} disabled={!password || password.length < 7 || isLoading}>
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unlock;
