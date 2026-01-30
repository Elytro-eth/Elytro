import { Button } from '@elytro/ui';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useState, useEffect } from 'react';
import { TChainItem } from '@/constants/chains';
import { useWallet } from '@/contexts/wallet';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { useAccount } from '@/contexts/account-context';
import NetworkSelection from '@/components/biz/NetworkSelection';
import { useChain } from '@/contexts/chain-context';
import { Box } from 'lucide-react';

export default function CreateNewAddress() {
  const { wallet } = useWallet();
  const { reloadAccount } = useAccount();
  const { getChains } = useChain();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);

  useEffect(() => {
    getChains();
  }, [getChains]);

  const handleChange = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  const handleCreate = async () => {
    if (!selectedChain) return;

    try {
      await wallet.createAccount(selectedChain.id);
      reloadAccount();
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SecondaryPageWrapper title="Create wallet">
      <NetworkSelection selectedChain={selectedChain} handleSelectChain={handleChange} />

      <Button className="w-full mt-4" onClick={handleCreate} disabled={!selectedChain}>
        <Box className="size-4 mr-sm stroke-white" />
        Create a wallet
      </Button>
    </SecondaryPageWrapper>
  );
}
