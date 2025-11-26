import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import WalletImg from '@/assets/wallet.png';
import { THookStatus } from '@/types/securityHook';
import { useCountdown } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { useWallet } from '@/contexts/wallet';

interface ForceInstallInnerPageProps {
  status: THookStatus;
}

export default function ForceInstallInnerPage({ status }: ForceInstallInnerPageProps) {
  const { forceUninstallAfter, canForceUninstall } = status;
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();

  const currentTimestamp = Math.ceil(Date.now() / 1000);
  const leftTime = canForceUninstall ? 0 : forceUninstallAfter - currentTimestamp;

  // forceUninstallAfter is a timestamp in Date
  // countdown is the difference between forceUninstallAfter and the current time
  const [countdown] = useCountdown({
    countStart: leftTime,
    intervalMs: 1000,
  });

  const hours = Math.floor(countdown / 3600);
  const minutes = Math.floor((countdown % 3600) / 60);
  const seconds = countdown % 60;

  const handleConfirmReset = async () => {
    console.log('Confirm Reset');
    try {
      const txs = await wallet.generateForceUninstallSecurityHookTxs();
      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as SafeAny, { noHookSignWith2FA: true });
    } catch (error) {
      console.error('Confirm Reset failed:', error);
    }
  };

  return (
    <SecondaryPageWrapper title="Sign with 2FA">
      <div className="flex flex-col gap-y-md items-center justify-center p-6">
        <img src={WalletImg} alt="Wallet" className="size-[9rem] mt-[20%] mx-auto" />
        <div className="text-center flex flex-col gap-y-2xs mb-4">
          <h1 className="elytro-text-subtitle mb-2">Reset Sign with 2FA</h1>
          <p className="text-gray-600">Resetting Sign with 2FA will take 7 days.</p>
        </div>

        {/* Countdown timer */}
        <div className="flex flex-row gap-x-sm">
          <div className="text-title leading-normal text-center ">
            <div className="text-3xl font-bold bg-gray-150  p-md rounded-sm">{hours.toString().padStart(2, '0')}</div>
            <div className="text-tiny">Hours</div>
          </div>
          <div className="text-title leading-normal text-center ">
            <div className="text-3xl font-bold bg-gray-150  p-md rounded-sm">{minutes.toString().padStart(2, '0')}</div>
            <div className="text-tiny">Minutes</div>
          </div>
          <div className="text-title leading-normal text-center ">
            <div className="text-3xl font-bold bg-gray-150 p-md rounded-sm">{seconds.toString().padStart(2, '0')}</div>
            <div className="text-tiny">Seconds</div>
          </div>
        </div>

        <Button
          className="mt-4 w-full bg-primary text-primary-foreground hover:bg-hover-primary hover:text-hover-primary-foreground"
          disabled={countdown > 0}
          onClick={handleConfirmReset}
        >
          Confirm Reset
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
