import Spin from '@/components/ui/Spin';
import { useAccount } from '@/contexts/account-context';
import { query, query_has_sponsored } from '@/requests/query';
import { navigateTo } from '@/utils/navigation';
import { useEffect, useState } from 'react';
import { toHex } from 'viem';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import EthereumIcon from '@/assets/ethereum.svg';
import DoorIcon from '@/assets/door.png';
import ContactsIcon from '@/assets/contacts.png';
import { cn } from '@/utils/shadcn/utils';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { Check } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function SetupTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSponsored, setHasSponsored] = useState(false);
  const { currentAccount, loading: isAccountLoading } = useAccount();
  const { handleTxRequest } = useTx();
  const [_, setHasSetupPassed] = useLocalStorage('hasSetupPassed', false);

  const getLeftSponsoredCount = async () => {
    setIsLoading(true);
    try {
      const res = (await query(query_has_sponsored, {
        input: { address: currentAccount.address, chainID: toHex(currentAccount.chainId) },
      })) as SafeAny;
      setHasSponsored(res.sponsorOpCheck.sponsorCountLeft > 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAccount.address || !currentAccount.chainId) return;
    getLeftSponsoredCount();
  }, [currentAccount.address, currentAccount.chainId]);

  const STEPS = [
    {
      title: 'Deposit ETH',
      icon: EthereumIcon,
      description: 'Deposit some ETH to activate wallet.',
      action: () => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Receive);
      },

      done: hasSponsored || (currentAccount.balance && currentAccount.balance > 1_000_000),
    },
    {
      title: 'Activate wallet',
      icon: DoorIcon,
      description: 'This unlocks all the wallet features. The fee for activation is on us.',
      action: () => {
        handleTxRequest(TxRequestTypeEn.DeployWallet);
      },
      done: currentAccount.isDeployed,
    },
    {
      title: 'Secure wallet',
      icon: ContactsIcon,
      description: 'Set up on-chain recovery or enable 2FA to secure your wallet.',
      action: () => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.SecureWallet);
      },
      done: currentAccount.isRecoveryEnabled,
    },
  ];

  const realSteps = hasSponsored ? STEPS.slice(1) : STEPS;

  return (
    <div className="flex flex-col p-4">
      <h1 className="font-bold w-full text-center text-3xl text-dark-blue">Welcome</h1>
      <p className="mb-xl text-sm w-full text-center text-gray-600">Complete setup to enable all features</p>

      <Spin isLoading={isLoading || isAccountLoading} />
      <div className="flex flex-col gap-y-md">
        {realSteps.map((step, index) => (
          <div
            key={step.title}
            className={cn('flex items-center gap-x-4  px-4 py-5 rounded-lg border border-gray-300')}
            // make it all grey when it's not done
            style={{
              filter: index === 0 || realSteps[index - 1]?.done || step.done ? 'none' : 'grayscale(100%)',
              cursor: step.done || (index > 0 && !realSteps[index - 1]?.done) ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (!step.done) {
                step.action();
              }
            }}
          >
            <img src={step.icon} alt={step.title} className="size-[70px]" />
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center gap-x-2">
                {step.done ? (
                  <Check className="size-5 p-1 bg-light-green rounded-full" />
                ) : (
                  <span className="font-medium text-white bg-black rounded-full size-4 text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                )}
                <span className="font-medium text-lg text-dark-blue">{step.title}</span>
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
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
