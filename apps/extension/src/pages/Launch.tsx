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
    <div className="elytro-gradient-bg flex flex-1 flex-col items-center px-xl min-h-screen gap-y-3xl pt-10">
      <img src={LaunchImg} alt="Launch" className="size-[128px] mt-20" />
      <h1 className="elytro-text-headline text-center">Your permanent Ethereum client</h1>
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-y-3">
          <Button size="large" onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode)}>
            Get Started
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
  );
}
