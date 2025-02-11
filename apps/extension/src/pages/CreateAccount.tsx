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
        description: 'Please select a chain to create your account',
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
      });
    }
  };

  const handleSelectChain = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  return (
    <SecondaryPageWrapper
      title="Create account"
      footer={
        <Button
          type="submit"
          className="w-full rounded-full h-14"
          size="large"
          onClick={handleCreateAccount}
        >
          Create
        </Button>
      }
    >
      <NetworkSelection
        selectedChain={selectedChain}
        handleSelectChain={handleSelectChain}
      />
    </SecondaryPageWrapper>
  );
};

export default CreateAccount;
