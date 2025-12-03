import React, { useState } from 'react';
import IconSuccess from '@/assets/door.png';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import useSearchParams from '@/hooks/use-search-params';
import { navigateTo } from '@/utils/navigation';
import { useWallet } from '@/contexts/wallet';
import { Box } from 'lucide-react';

const YouAreIn: React.FC = () => {
  const params = useSearchParams();
  const isFromRecover = params.from === 'recover';
  const { wallet } = useWallet();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const { title, description, action, actionPath, beforeAction } = isFromRecover
    ? {
        title: 'Get ready to recover',
        description: 'You will need the network and wallet address',
        action: 'Start Recovery',
        actionPath: SIDE_PANEL_ROUTE_PATHS.AccountRecovery,
      }
    : {
        title: 'Welcome!',
        description: 'Let’s create your Elytro smart contract wallet',
        action: (
          <>
            <Box className="size-4 mr-sm" color="#cce1ea" />
            Start with new wallet
          </>
        ),
        actionPath: SIDE_PANEL_ROUTE_PATHS.Dashboard,
        beforeAction: async () => {
          await wallet.createAccount(1); // create ethereum mainnet account as default
        },
      };

  const handleNavigate = async () => {
    await beforeAction?.();
    setIsFadingOut(true);
    // Wait for fade-out animation before navigating
    setTimeout(() => {
      navigateTo('side-panel', actionPath);
    }, 150); // Match animation duration
  };

  return (
    <FullPageWrapper
      className={`h-full page-fade-in ${isFadingOut ? 'page-fade-out' : ''}`}
      onBack={() => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }}
    >
      <div className="flex flex-col items-center gap-y-2xl flex-1 w-full">
        <div className="flex justify-center pt-20">
          <img src={IconSuccess} alt="Passcode" width={164} />
        </div>

        <div className="flex flex-col gap-y-sm">
          <h1 className="elytro-text-title text-center">{title}</h1>
          <h2 className="elytro-text-smaller-body text-muted-foreground text-center">{description}</h2>
        </div>

        <Button className="w-full rounded-full h-14" onClick={handleNavigate}>
          {action}
        </Button>
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

export default YouAreIn;
