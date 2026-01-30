import { Button } from '@elytro/ui';
import { bgWalletSm } from '@elytro/ui/assets';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';

export default function InternalCreateAccount() {
  return (
    <SecondaryPageWrapper title="Create wallet" className="w-full h-screen flex flex-col items-center justify-center">
      <img src={bgWalletSm} alt="Wallet" className="size-[200px] mt-[20%] mx-auto mb-2xl" />
      <div className="text-center flex flex-col gap-y-2xs mb-10">
        <h1 className="elytro-text-subtitle font-bold b-2">Add a new wallet</h1>
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
