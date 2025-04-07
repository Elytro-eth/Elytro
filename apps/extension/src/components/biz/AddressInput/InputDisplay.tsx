import FragmentedAddress from '../FragmentedAddress';
import ENSInfoComponent from '../ENSInfo';

interface IInputDisplayProps {
  displayLabel: string;
  ensInfo: TRecentAddress | null;
  chainId: number;
  onClick: () => void;
}
const InputDisplay = ({
  displayLabel,
  ensInfo,
  chainId,
  onClick,
}: IInputDisplayProps) => {
  if (!displayLabel && !ensInfo) return null;

  return (
    <div className="absolute bg-white" onClick={onClick}>
      {displayLabel ? (
        <FragmentedAddress address={displayLabel} chainId={chainId} size="lg" />
      ) : ensInfo ? (
        ensInfo.name ? (
          <ENSInfoComponent ensInfo={ensInfo} />
        ) : (
          <FragmentedAddress
            address={ensInfo.address}
            chainId={chainId}
            size="lg"
          />
        )
      ) : null}
    </div>
  );
};

export default InputDisplay;
