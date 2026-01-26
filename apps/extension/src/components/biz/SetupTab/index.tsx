import { useAccount } from '@/contexts/account-context';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { cn } from '@/utils/shadcn/utils';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { Check, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSponsor } from '@/hooks/use-sponsor';

export default function SetupTab() {
  const { currentAccount } = useAccount();
  const { canSponsor } = useSponsor();
  const { handleTxRequest } = useTx();
  const [_, setHasSetupPassed] = useLocalStorage(`hasSetupPassed_${currentAccount.address}`, false);

  const STEPS = [
    {
      title: 'Add tokens',
      description: 'Deposit ETH to activate wallet.',
      action: () => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
      },
      done: canSponsor || (currentAccount.balance && currentAccount.balance > 1_000_000),
    },
    {
      title: 'Activate wallet',
      showTag: canSponsor,
      description: 'Unlock all wallet features.',
      action: () => {
        handleTxRequest(TxRequestTypeEn.DeployWallet);
      },
      done: currentAccount.isDeployed,
    },
    {
      title: 'Set up Recovery',
      description: 'Your friends can help recover.',
      action: () => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RecoverySetting);
      },
      done: currentAccount.isRecoveryEnabled,
    },
  ];

  const realSteps = canSponsor ? STEPS.slice(1) : STEPS;

  return (
    <div className="flex flex-col p-4">
      <h1 className="font-bold w-full text-left text-3xl text-blue-900 mb-xl pl-lg">Welcome</h1>

      <div className="flex flex-col gap-y-md">
        {realSteps.map((step, index) => {
          // Allow "Activate wallet" to be enabled if canSponsor is true (sponsored activation)
          // or if user has any balance (even if balance check hasn't passed yet)
          // This prevents blocking activation when user has funds but balance check hasn't updated
          const canActivateWallet =
            step.title === 'Activate wallet' &&
            (canSponsor || (currentAccount.balance !== undefined && currentAccount.balance !== null));
          const isDisabled = step.done || (!canActivateWallet && index > 0 && !realSteps[index - 1]?.done);
          return (
            <div
              key={step.title}
              className={cn('flex items-center gap-x-3 px-4 py-4 rounded-md bg-brown-150 hover:bg-brown-300')}
              // make it all grey when it's not done
              style={{
                filter: index === 0 || realSteps[index - 1]?.done || step.done ? 'none' : 'grayscale(100%)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: isDisabled ? 'none' : 'auto',
              }}
              onClick={() => {
                if (!isDisabled) {
                  step.action();
                }
              }}
            >
              {step.done ? (
                <div className="size-8 rounded-full bg-green-300 flex items-center justify-center flex-shrink-0">
                  <Check className="size-4 text-white" />
                </div>
              ) : (
                <div className="size-8 rounded-full bg-brown-600 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-white text-lg">{index + 1}</span>
                </div>
              )}
              <div className="flex flex-col gap-y-0 flex-1 min-w-0">
                <span className={cn('font-bold text-lg', step.done || isDisabled ? 'text-gray-600' : 'text-blue-900')}>
                  {step.title}
                </span>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              {!isDisabled && !step.done && <ChevronRight className="size-5 text-gray-450 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {currentAccount.isDeployed && (
        <div
          className="w-full text-center mt-10 text-xs text-gray-450 hover:text-gray-600 cursor-pointer"
          onClick={() => setHasSetupPassed(true)}
        >
          Remind me later
        </div>
      )}
    </div>
  );
}
