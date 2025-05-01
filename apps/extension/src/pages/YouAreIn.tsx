import React from 'react';
import IconSuccess from '@/assets/door.png';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import useSearchParams from '@/hooks/use-search-params';
import { navigateTo } from '@/utils/navigation';

const YouAreIn: React.FC = () => {
  const params = useSearchParams();
  const isFromRecover = params.from === 'recover';

  const { title, description, action, actionPath } = isFromRecover
    ? {
        title: 'You are ready to recover',
        description: 'You will need the passcode to see recovery status',
        action: 'Start recover',
        actionPath: SIDE_PANEL_ROUTE_PATHS.AccountRecovery,
      }
    : {
        title: 'Welcome!',
        description: 'Let’s create your first smart contract wallet',
        action: 'Create wallet',
        actionPath: SIDE_PANEL_ROUTE_PATHS.CreateAccount,
      };

  return (
    <FullPageWrapper
      onBack={() => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
      }}
    >
      <div className="flex justify-center pt-20">
        <img src={IconSuccess} alt="Passcode" width={164} />
      </div>

      <div className="flex flex-col gap-y-2xs">
        <h1 className="elytro-text-title text-center">{title}</h1>
        <h2 className="elytro-text-smaller-body text-muted-foreground text-center">{description}</h2>
      </div>

      <Button
        className="w-full rounded-full h-14"
        size="large"
        onClick={() => {
          navigateTo('side-panel', actionPath);
        }}
      >
        {action}
      </Button>
    </FullPageWrapper>
  );
};

export default YouAreIn;
