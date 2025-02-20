import ChainItem from '@/components/ui/ChainItem';
import { TChainItem } from '@/constants/chains';
import { useChain } from '@/contexts/chain-context';

interface INetworkSelectionProps {
  selectedChain: TChainItem | null;
  handleSelectChain: (chain: TChainItem) => void;
}

export default function NetworkSelection({
  selectedChain,
  handleSelectChain,
}: INetworkSelectionProps) {
  const { chains } = useChain();

  const renderChains = (isTestnet: boolean) => (
    <div className="flex flex-col gap-y-sm">
      <div className="elytro-text-body text-gray-600">
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </div>
      {chains
        .filter((chain) => (isTestnet ? chain.testnet : !chain.testnet))
        .map((chain) => (
          <ChainItem
            key={chain.id}
            chain={chain}
            isSelected={selectedChain?.id === chain.id}
            onClick={() => handleSelectChain(chain)}
          />
        ))}
    </div>
  );

  return (
    <div>
      <div className="space-y-4">
        <h1 className="elytro-text-bold-body">Select a network</h1>
      </div>
      <div className="flex flex-col space-y-4 pt-4">
        {renderChains(false)}
        {renderChains(true)}
      </div>
    </div>
  );
}
