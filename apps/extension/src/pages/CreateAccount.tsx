import React, { useEffect, useState } from 'react';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import { useChain } from '@/contexts/chain-context';
import { useWallet } from '@/contexts/wallet';
import NetworkSelection from '@/components/biz/NetworkSelection';

const CreateAccount: React.FC = () => {
  const { getChains } = useChain();
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);

  useEffect(() => {
    getChains();
  }, []);

  const handleCreateAccount = async () => {
    if (!selectedChain) {
      toast({
        title: 'Please select a chain',
        description: 'Please select a chain to create your wallet',
      });
      return;
    }

    try {
      await wallet.createAccount(selectedChain.id);

      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
        variant: 'destructive',
      });
    }
  };

  const handleSelectChain = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  return (
    <SecondaryPageWrapper title="Create wallet">
      <NetworkSelection
        selectedChain={selectedChain}
        handleSelectChain={handleSelectChain}
      />

      <Button
        type="submit"
        className="w-full rounded-full mt-10"
        size="large"
        onClick={handleCreateAccount}
      >
        Continue
      </Button>
    </SecondaryPageWrapper>
  );
};

export default CreateAccount;
