import ShortedAddress from '@/components/ui/ShortedAddress';
import ENSInfoComponent from '../ENSInfo';

interface IInputDisplayProps {
  displayLabel: string;
  ensInfo: TRecentAddress | null;
  chainId: number;
  onClick: () => void;
}
const InputDisplay = ({ displayLabel, ensInfo, chainId, onClick }: IInputDisplayProps) => {
  if (!displayLabel && !ensInfo) return null;

  return (
    <div className="absolute bg-white" onClick={onClick}>
      {displayLabel ? (
        <ShortedAddress
          address={displayLabel}
          chainId={chainId}
          size="lg"
          showChainIcon={false}
          className="!bg-transparent !p-0"
        />
      ) : ensInfo ? (
        ensInfo.name ? (
          <ENSInfoComponent ensInfo={ensInfo} />
        ) : (
          <ShortedAddress
            address={ensInfo.address}
            chainId={chainId}
            size="lg"
            showChainIcon={false}
            className="!bg-transparent !p-0"
          />
        )
      ) : null}
    </div>
  );
};

export default InputDisplay;
