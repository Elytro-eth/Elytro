import React, { useEffect, useState } from 'react';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { getIconByChainId, TChainItem } from '@/constants/chains';
import { toast } from '@/hooks/use-toast';
import { useChain } from '@/contexts/chain-context';
import { useWallet } from '@/contexts/wallet';
import NetworkSelection from '@/components/biz/NetworkSelection';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import DoorImg from '@/assets/door.png';
import { useAccount } from '@/contexts/account-context';
import { formatAddressToShort } from '@/utils/format';
import Spin from '@/components/ui/Spin';

const CreateAccount: React.FC = () => {
  const { getChains } = useChain();
  const { wallet } = useWallet();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);
  const [isCreated, setIsCreated] = useState(false);
  const { currentAccount, reloadAccount, loading: isLoading } = useAccount();

  useEffect(() => {
    getChains();
  }, []);

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

  if (isCreated) {
    return (
      <FullPageWrapper className="h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-y-2xs">
          <img src={DoorImg} alt="Passcode" width={144} />

          <h1 className="elytro-text-title text-center mt-2">Your wallet is created</h1>

          {isLoading ? (
            <Spin isLoading />
          ) : (
            <div className="elytro-text-xs text-center mt-2 px-2 py-1 rounded-md bg-white flex items-center gap-x-sm">
              <img src={getIconByChainId(currentAccount?.chainId)} alt="Chain" width={16} />
              {formatAddressToShort(currentAccount?.address)}
            </div>
          )}
        </div>

        <Button
          className="w-full mt-4 text-lg font-medium"
          onClick={() => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard)}
        >
          Start
        </Button>
      </FullPageWrapper>
    );
  }

  return (
    <SecondaryPageWrapper title="Create wallet">
      <NetworkSelection selectedChain={selectedChain} handleSelectChain={handleSelectChain} />

      <Button type="submit" className="w-full rounded-full mt-10" size="large" onClick={handleCreateAccount}>
        Continue
      </Button>
    </SecondaryPageWrapper>
  );
};

export default CreateAccount;
