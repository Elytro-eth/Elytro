import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import WalletImg from '@/assets/wallet.png';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';

export default function InternalCreateAccount() {
  return (
    <SecondaryPageWrapper title="Create wallet" className="w-full h-screen flex flex-col items-center justify-center">
      <img src={WalletImg} alt="Wallet" className="size-[9rem] mt-[20%] mx-auto" />
      <div className="text-center flex flex-col gap-y-2xs mb-10">
        <h1 className="elytro-text-subtitle mb-2">Add a new wallet</h1>
      </div>
      <div className="flex flex-col gap-y-md w-full">
        <Button
          onClick={() => {
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateNewAddress);
          }}
        >
          Create new wallet
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.InternalImportBackup)}
        >
          Import a wallet
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
