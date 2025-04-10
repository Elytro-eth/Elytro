import WalletImg from '@/assets/wallet.png';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';
import FullPageWrapper from '@/components/biz/FullPageWrapper';

export default function Transfer() {
  return (
    <FullPageWrapper className="elytro-gradient-bg-2">
      <img src={WalletImg} alt="Wallet" className="size-[144px] mt-10" />
      <div className="text-center flex flex-col ap-y-2xs">
        <h1 className="elytro-text-subtitle mb-2">
          Manage your
          <br />
          Elytro wallets
        </h1>
        <p className="elytro-text-smaller-body text-gray-600">
          Smart contract wallets created on Elytro only
        </p>
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
          onClick={() =>
            toast({
              title: 'Import feature is not available yet',
              description: 'Please wait for the update',
            })
          }
        >
          Import a wallet
        </Button>
      </div>
    </FullPageWrapper>
  );
}
