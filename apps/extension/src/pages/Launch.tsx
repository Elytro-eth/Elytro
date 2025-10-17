import LaunchImg from '@/assets/launch.png';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { useEffect } from 'react';

export default function Launch() {
  // clear all search params in url
  useEffect(() => {
    window.history.replaceState({}, '', window.location.pathname);
  }, []);
  return (
    <div className="elytro-gradient-bg flex flex-1 flex-col items-center px-xl min-h-screen pt-10">
      <div className="flex flex-col items-center gap-y-3xl flex-1">
        <img src={LaunchImg} alt="Launch" className="size-[8rem] mt-20" />
        <h1 className="elytro-text-headline text-center">Your recoverable Ethereum wallet</h1>
        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-y-3">
            <Button size="large" onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode)}>
              Get started
            </Button>
            <Button
              size="large"
              variant="secondary"
              onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Transfer)}
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
