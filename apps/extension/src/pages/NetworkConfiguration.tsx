import React, { useCallback, useEffect, useState } from 'react';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { TChainItem } from '@/constants/chains';
// import { toast } from '@/hooks/use-toast';
import { useChain } from '@/contexts/chain-context';
import NetworkSelection from '@/components/biz/NetworkSelection';
import NetworkEditor from '@/components/biz/NetworkEditor';

enum NetworkConfigPageState {
  LIST = 'chain-list',
  EDIT = 'chain-edit',
}

const NetworkConfiguration: React.FC = () => {
  const { getChains } = useChain();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(null);
  const [pageState, setPageState] = useState<NetworkConfigPageState>(NetworkConfigPageState.LIST);

  useEffect(() => {
    getChains();
  }, []);

  const onSelectChain = useCallback((chain: TChainItem) => {
    setSelectedChain(chain);
    setPageState(NetworkConfigPageState.EDIT);
  }, []);

  const onPageBack = useCallback(() => {
    if (pageState !== NetworkConfigPageState.LIST) {
      setPageState(NetworkConfigPageState.LIST);
      return;
    }
    history.back();
  }, [pageState]);

  const onChainConfigChanged = useCallback(() => {
    getChains();
    setPageState(NetworkConfigPageState.LIST);
  }, []);

  return (
    <SecondaryPageWrapper title="Networks" onBack={onPageBack}>
      {pageState === NetworkConfigPageState.LIST && (
        <NetworkSelection
          selectedChain={selectedChain}
          disabledChainsWhichHasExistAccount={false}
          handleSelectChain={onSelectChain}
        />
      )}
      {pageState === NetworkConfigPageState.EDIT && (
        <NetworkEditor chain={selectedChain!} onChanged={onChainConfigChanged} />
      )}
    </SecondaryPageWrapper>
  );
};

export default NetworkConfiguration;
