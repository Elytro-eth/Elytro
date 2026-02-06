import React, { useEffect, useState } from 'react';
import { PasswordSetter } from '@/components/ui/PasswordSetter';
import { bgPasscodeSm } from '@elytro/ui/assets';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { toast } from '@elytro/ui';
import { useWallet } from '@/contexts/wallet';
import useSearchParams from '@/hooks/use-search-params';
import { WalletStatusEn } from '@/background/walletController';

const Create: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const { status, wallet } = useWallet();
  const params = useSearchParams();

  useEffect(() => {
    if (status === WalletStatusEn.NoAccount) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Education, params);
    }
  }, [status, params]);

  const handleCreatePassword = async (pwd: string) => {
    try {
      setLoading(true);
      await wallet.createNewOwner(pwd);
      // TODO: check if this is accurate.

      console.log('params', params);
      if (params?.from === 'recover') {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.AccountRecovery, params);
      } else {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Education);
      }
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullPageWrapper className={`elytro-gradient-bg-2 h-full page-fade-in`} showBack>
      <div className="flex flex-col items-center gap-y-2xl flex-1 w-full">
        <div className="flex justify-center mt-10">
          <img src={bgPasscodeSm} alt="Passcode" width={200} />
        </div>
        <h1 className="elytro-text-title text-center">Set your passcode</h1>
        <h2 className="text-sm text-muted-foreground text-center -mt-4">
          This is for accessing your wallets on this device
        </h2>
        <PasswordSetter onSubmit={(pwd) => handleCreatePassword(pwd)} loading={loading} />
      </div>
      <p className="text-xs text-gray-500 text-center px-4 -mb-1">
        By continuing, you accept our{' '}
        <a
          href="https://elytro.notion.site/elytro-terms-of-use"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Terms
        </a>{' '}
        &{' '}
        <a
          href="https://elytro.notion.site/elytro-privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Privacy
        </a>
      </p>
    </FullPageWrapper>
  );
};

export default Create;
