import { Button } from '@elytro/ui';
import { bgWalletLg } from '@elytro/ui/assets';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import FullPageWrapper from '@/components/biz/FullPageWrapper';

export default function Transfer() {
  return (
    <FullPageWrapper className="elytro-gradient-bg-2 h-full">
      <img src={bgWalletLg} alt="Wallet" className="size-[full] my-10" />
      <div className="text-left flex flex-col w-full gap-y-2xs">
        <h1 className="elytro-text-headline mb-6">
          Already have
          <br />
          an Elytro wallet
        </h1>
      </div>
      <div className="flex flex-col gap-y-md w-full">
        <Button
          onClick={() => {
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode, {
              from: 'recover',
            });
          }}
        >
          Recover a wallet
        </Button>
        <Button
          variant="secondary"
          className="bg-blue-300 hover:bg-blue-450"
          onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportBackup)}
        >
          Import wallets
        </Button>
      </div>
    </FullPageWrapper>
  );
}
