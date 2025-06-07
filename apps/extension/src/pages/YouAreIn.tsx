import React from 'react';
import IconSuccess from '@/assets/door.png';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import useSearchParams from '@/hooks/use-search-params';
import { navigateTo } from '@/utils/navigation';
import { useWallet } from '@/contexts/wallet';

const YouAreIn: React.FC = () => {
  const params = useSearchParams();
  const isFromRecover = params.from === 'recover';
  const { wallet } = useWallet();

  const { title, description, action, actionPath, beforeAction } = isFromRecover
    ? {
        title: 'Get ready to recover',
        description: 'You will need the network and wallet address',
        action: 'Start Recovery',
        actionPath: SIDE_PANEL_ROUTE_PATHS.AccountRecovery,
      }
    : {
        title: 'Welcome!',
        description: "Let's get you started",
        action: 'Start',
        actionPath: SIDE_PANEL_ROUTE_PATHS.Dashboard,
        beforeAction: async () => {
          await wallet.createAccount(1); // create ethereum mainnet account as default
        },
      };

  return (
    <FullPageWrapper
      className="h-full"
      onBack={() => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }}
    >
      <div className="flex justify-center pt-20">
        <img src={IconSuccess} alt="Passcode" width={164} />
      </div>

      <div className="flex flex-col gap-y-sm">
        <h1 className="elytro-text-title text-center">{title}</h1>
        <h2 className="elytro-text-smaller-body text-muted-foreground text-center">{description}</h2>
      </div>

      <Button
        className="w-full rounded-full h-14"
        size="large"
        onClick={async () => {
          await beforeAction?.();
          navigateTo('side-panel', actionPath);
        }}
      >
        {action}
      </Button>
    </FullPageWrapper>
  );
};

export default YouAreIn;
