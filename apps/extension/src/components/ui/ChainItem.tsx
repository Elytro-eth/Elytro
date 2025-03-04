import { TChainItem } from '@/constants/chains';
import { cn } from '@/utils/shadcn/utils';

interface IChainItemProps {
  chain: TChainItem & { disabled?: boolean };
  onClick?: () => void;
  isSelected?: boolean; // TODO: remove this
}

export default function ChainItem({
  chain,
  onClick,
  isSelected = false,
}: IChainItemProps) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      onClick={chain.disabled ? undefined : handleClick}
      className={cn(
        'flex flex-row items-center gap-md p-lg rounded-sm bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer',
        isSelected && 'bg-gray-100',
        onClick && 'cursor-pointer',
        chain.disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <img
        src={chain?.icon}
        alt={chain?.name}
        className="size-8 rounded-full"
      />
      <div className="elytro-text-small-bold">{chain?.name}</div>
    </div>
  );
}
