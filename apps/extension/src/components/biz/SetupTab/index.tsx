import Spin from '@/components/ui/Spin';
import { useAccount } from '@/contexts/account-context';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import EthereumIcon from '@/assets/coin_eth.png';
import DoorIcon from '@/assets/door.png';
import ContactsIcon from '@/assets/contacts.png';
import { cn } from '@/utils/shadcn/utils';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { Check } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSponsor } from '@/hooks/use-sponsor';

export default function SetupTab() {
  const { currentAccount, loading: isAccountLoading } = useAccount();
  const { canSponsor, isLoading } = useSponsor();
  const { handleTxRequest } = useTx();
  const [_, setHasSetupPassed] = useLocalStorage(`hasSetupPassed_${currentAccount.address}`, false);

  const STEPS = [
    {
      title: 'Deposit ETH',
      icon: EthereumIcon,
      description: 'Deposit ETH to activate wallet.',
      action: () => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
      },
      done: canSponsor || (currentAccount.balance && currentAccount.balance > 1_000_000),
    },
    {
      title: 'Activate wallet',
      icon: DoorIcon,
      showTag: canSponsor,
      description: 'Unlock all wallet features.',
      action: () => {
        handleTxRequest(TxRequestTypeEn.DeployWallet);
      },
      done: currentAccount.isDeployed,
    },
    {
      title: 'Set up Recovery',
      icon: ContactsIcon,
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
      <h1 className="font-bold w-full text-center text-3xl text-black-blue">Welcome</h1>
      <p className="mb-xl text-sm w-full text-center text-gray-600">Complete setup to enable all features</p>

      <Spin isLoading={isLoading || isAccountLoading} />
      <div className="flex flex-col gap-y-md">
        {realSteps.map((step, index) => {
          const isDisabled = step.done || (index > 0 && !realSteps[index - 1]?.done);
          return (
            <div
              key={step.title}
              className={cn('flex items-center gap-x-2 px-4 py-2 rounded-md bg-gray-150 hover:bg-gray-300')}
              // make it all grey when it's not done
              style={{
                filter: index === 0 || realSteps[index - 1]?.done || step.done ? 'none' : 'grayscale(100%)',
                opacity: index === 0 || realSteps[index - 1]?.done || step.done ? '1' : '.5',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: isDisabled ? 'none' : 'auto',
                backgroundColor: isDisabled ? '#F8F9FA' : '',
              }}
              onClick={() => {
                if (!isDisabled) {
                  step.action();
                }
              }}
            >
              <img src={step.icon} alt={step.title} className="size-[60px]" />
              <div className="flex flex-col gap-y-0 flex-1 min-w-0">
                <div className="flex items-center gap-x-2 min-w-0">
                  {step.done ? (
                    <Check className="size-5 p-1 bg-light-green rounded-full flex-shrink-0" />
                  ) : (
                    <span className="font-bold text-white bg-black-blue rounded-full size-4 text-sm flex items-center justify-center flex-shrink-0 p-1">
                      {index + 1}
                    </span>
                  )}
                  <span className="font-bold text-lg text-black-blue whitespace-nowrap flex-shrink-0">
                    {step.title}
                  </span>
                  {/* {step.showTag && (
                    <span className="font-medium text-sm text-dark-blue bg-light-green rounded-2xs px-2 py-1 whitespace-nowrap min-w-0 overflow-hidden text-ellipsis">
                      Sponsored
                    </span>
                  )} */}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentAccount.isDeployed && (
        <div
          className="w-full text-center mt-10 text-sm text-gray-600 cursor-pointer"
          onClick={() => setHasSetupPassed(true)}
        >
          Remind me later
        </div>
      )}
    </div>
  );
}
