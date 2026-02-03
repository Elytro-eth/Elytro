import React, { useState } from 'react';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button, toast, Spin } from '@elytro/ui';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { TChainItem } from '@/constants/chains';

import { useWallet } from '@/contexts/wallet';
import NetworkSelection from '@/components/biz/NetworkSelection';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { bgWalletLg } from '@elytro/ui/assets';
import { useAccount } from '@/contexts/account-context';
import CurrentAddress from '@/components/biz/CurrentAddress';

const CreateAccount: React.FC = () => {
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  const { reloadAccount, loading: isLoading } = useAccount();

  const handleSelectChain = async (chain: TChainItem) => {
    setSelectedChain(chain);

    try {
      await wallet.createAccount(chain.id);
      await reloadAccount();
      setIsCreated(true);
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    }
  };

  const handleStart = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  if (isCreated) {
    return (
      <FullPageWrapper className={`h-full flex flex-col items-center justify-center page-fade-in`}>
        <div className="flex flex-col items-center gap-y-2xs">
          <img src={bgWalletLg} alt="Passcode" width={200} />

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
    </SecondaryPageWrapper>
  );
};

export default CreateAccount;
