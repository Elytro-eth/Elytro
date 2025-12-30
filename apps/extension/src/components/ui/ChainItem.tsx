import { TChainItem } from '@/constants/chains';
import { cn } from '@/utils/shadcn/utils';

interface IChainItemProps {
  chain: TChainItem & { disabled?: boolean };
  onClick?: () => void;
  isSelected?: boolean; // TODO: remove this
}

export default function ChainItem({ chain, onClick, isSelected = false }: IChainItemProps) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      onClick={chain.disabled ? undefined : handleClick}
      className={cn(
        'flex flex-row items-center gap-md px-lg py-md rounded-sm bg-gray-50 hover:bg-gray-300 border-gray-300 cursor-pointer',
        isSelected && 'bg-gray-300',
        onClick && 'cursor-pointer',
        chain.disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <img src={chain?.icon} alt={chain?.name} className="size-7 rounded-full" />
      <div className="elytro-text-body">{chain?.name}</div>
    </div>
  );
}
