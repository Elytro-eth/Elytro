import ChainItem from '@/components/ui/ChainItem';
import { TChainItem } from '@/constants/chains';
import { useChain } from '@/contexts/chain-context';
import { useMemo } from 'react';

interface INetworkSelectionProps {
  selectedChain: TChainItem | null;
  disabledChainsWhichHasExistAccount?: boolean;
  handleSelectChain: (chain: TChainItem) => void;
}

export default function NetworkSelection({ selectedChain, handleSelectChain }: INetworkSelectionProps) {
  const { chains } = useChain();

  const { testnetChains, mainnetChains } = useMemo(() => {
    // const disabledChainsThatHasAccount = (targetChains: TChainItem[]) => {
    //   if (disabledChainsWhichHasExistAccount === false) {
    //     return targetChains;
    //   }
    //   return targetChains.map((chain) => {
    //     const disabled = accounts.some(({ chainId }) => chainId === chain.id);
    //     return {
    //       ...chain,
    //       disabled,
    //     };
    //   });
    // };

    const testnetChains = chains.filter((chain) => chain.testnet);
    const mainnetChains = chains.filter((chain) => !chain.testnet);

    return {
      testnetChains,
      mainnetChains,
    };
  }, [chains]);

  const renderChains = (chains: TChainItem[], title: string) => {
    if (!chains.length) return null;
    return (
      <div className="flex flex-col gap-y-sm">
        <div className="elytro-text-body text-gray-600 text-base">{title}</div>
        {chains.map((chain) => (
          <ChainItem
            key={chain.id}
            chain={chain}
            isSelected={selectedChain?.id === chain.id}
            onClick={() => handleSelectChain(chain)}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="space-y-4">
        <h1 className="elytro-text-bold-body">Select network</h1>
        <div className="flex flex-col space-y-4">
          {renderChains(mainnetChains, 'Mainnet')}
          {renderChains(testnetChains, 'Testnet')}
        </div>
      </div>
    </div>
  );
}
