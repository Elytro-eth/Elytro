import WalletImg from '@/assets/wallet.png';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import FullPageWrapper from '@/components/biz/FullPageWrapper';

export default function Transfer() {
  return (
    <FullPageWrapper className="elytro-gradient-bg-2 h-full">
      <img src={WalletImg} alt="Wallet" className="size-[9rem] mt-10" />
      <div className="text-center flex flex-col gap-y-2xs">
        <h1 className="elytro-text-subtitle mb-6">
          Already have
          <br />
          an Elytro wallet
        </h1>
      </div>
      <div className="flex flex-col gap-y-md w-full">
        <Button
          size="large"
          onClick={() => {
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreatePasscode, {
              from: 'recover',
            });
          }}
        >
          Recover a wallet
        </Button>
        <Button
          size="large"
          variant="secondary"
          onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportBackup)}
        >
          Import all wallets
        </Button>
      </div>
    </FullPageWrapper>
  );
}
