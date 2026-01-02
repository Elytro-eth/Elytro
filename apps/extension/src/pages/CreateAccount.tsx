import React, { useState } from 'react';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';

import { useWallet } from '@/contexts/wallet';
import NetworkSelection from '@/components/biz/NetworkSelection';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import DoorImg from '@/assets/bg-images/wallet-bg-lg.png';
import { useAccount } from '@/contexts/account-context';
import Spin from '@/components/ui/Spin';
import CurrentAddress from '@/components/biz/CurrentAddress';

const CreateAccount: React.FC = () => {
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  const { reloadAccount, loading: isLoading } = useAccount();

  const handleCreateAccount = async () => {
    if (!selectedChain) {
      toast({
        title: 'Please select a network',
        // description: 'Please select a chain to create your wallet',
      });
      return;
    }

    try {
      await wallet.createAccount(selectedChain.id);
      await reloadAccount();
      setIsCreated(true);
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    }
  };

  const handleSelectChain = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  const handleStart = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  if (isCreated) {
    return (
      <FullPageWrapper className={`h-full flex flex-col items-center justify-center page-fade-in`}>
        <div className="flex flex-col items-center gap-y-2xs">
          <img src={DoorImg} alt="Passcode" width={200} />

          <h1 className="elytro-text-title text-center mt-6">Your wallet is created</h1>

          {isLoading ? <Spin isLoading /> : <CurrentAddress className="mt-6" />}
        </div>

        <Button className="w-full mt-4 text-lg font-medium" onClick={handleStart}>
          Start
        </Button>
      </FullPageWrapper>
    );
  }

  return (
    <SecondaryPageWrapper title="Create wallet">
      <NetworkSelection selectedChain={selectedChain} handleSelectChain={handleSelectChain} />

      <Button type="submit" className="w-full rounded-full mt-10" onClick={handleCreateAccount}>
        Continue
      </Button>
    </SecondaryPageWrapper>
  );
};

export default CreateAccount;
