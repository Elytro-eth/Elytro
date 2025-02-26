import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useState } from 'react';
import { TChainItem } from '@/constants/chains';
import { useWallet } from '@/contexts/wallet';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

import NetworkSelection from '@/components/biz/NetworkSelection';

export default function CreateNewAddress() {
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);
  const handleChange = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  const handleCreate = async () => {
    if (!selectedChain) return;

    try {
      await wallet.createAccount(selectedChain.id);
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SecondaryPageWrapper title="Create New Address">
      <NetworkSelection
        selectedChain={selectedChain}
        handleSelectChain={handleChange}
      />

      <Button
        size="large"
        className="w-full mt-4"
        onClick={handleCreate}
        disabled={!selectedChain}
      >
        Create
      </Button>
    </SecondaryPageWrapper>
  );
}
