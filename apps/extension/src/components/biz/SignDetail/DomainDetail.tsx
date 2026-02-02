import LabelValue from '../LabelValue';
import ShortedAddress from '@/components/ui/ShortedAddress';

interface IDomainDetail {
  message: string;
}

const labelMap: Record<string, string> = {
  name: 'Name',
  version: 'Version',
  chainId: 'Chain ID',
  verifyingContract: 'Verifying Contract',
  salt: 'Salt',
};

const FieldRender = ({ label, value }: { label: string; value: string }) => {
  let renderValue;

  switch (label) {
    case 'chainId':
      // renderValue = chainIdToChainNameMap[Number(value)] || '--';
      // TODO: get chain name from chain config
      renderValue = value || '--';
      break;
    case 'verifyingContract':
      renderValue = (
        <ShortedAddress address={value as string} showChainIcon={false} hideTooltip className="!bg-transparent !p-0" />
      );
      break;
    default:
      renderValue = value || '--';
  }

  const displayLabel = labelMap[label] || label;

  return <LabelValue label={displayLabel} value={renderValue} />;
};

export default function DomainDetail({ message }: IDomainDetail) {
  const domain = JSON.parse(message).domain as EIP712Domain;

  if (!domain) {
    return null;
  }

  return (
    <div className="text-sm text-gray-500 mb-3 space-y-1 bg-gray-150 rounded-2xl p-4">
      {Object.entries(domain).map(([key, value]) => (
        <FieldRender key={key} label={key} value={value as string} />
      ))}
    </div>
  );
}
