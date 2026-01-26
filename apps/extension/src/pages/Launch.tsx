import LaunchImg from '@/assets/launch.png';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { useEffect } from 'react';

export default function Launch() {
  useEffect(() => {
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleNavigate = (path: string) => {
    navigateTo('side-panel', path as SIDE_PANEL_ROUTE_PATHS);
  };

  return (
    <div className={`elytro-gradient-bg flex flex-1 flex-col items-center px-xl min-h-screen pt-10 page-fade-in`}>
      <div className="flex flex-col items-center gap-y-3xl flex-1">
        <img src={LaunchImg} alt="Launch" className="size-[12rem] mt-20" />
        <h1 className="elytro-text-headline">Your next-gen Ethereum wallet</h1>
        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-y-3">
            <Button onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.CreatePasscode)}>Create a new wallet</Button>
            <Button
              variant="secondary"
              className="bg-green-300 hover:bg-green-450"
              onClick={() => handleNavigate(SIDE_PANEL_ROUTE_PATHS.Transfer)}
            >
              Already have a wallet
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center px-4 pb-4">
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
    </div>
  );
}
