import { TChainConfigItem } from '@/constants/chains';
import { cn } from '@/utils/shadcn/utils';

interface IChainItemProps {
  chain: TChainConfigItem;
  onClick?: () => void;
  isSelected?: boolean;
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
      onClick={handleClick}
      className={cn(
        'flex flex-row items-center gap-md p-lg rounded-sm bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer',
        isSelected && 'bg-gray-100',
        onClick && 'cursor-pointer'
      )}
    >
      <img src={chain?.icon} alt={chain?.chainName} className="size-8" />
      <div className="elytro-text-small-bold">{chain?.chainName}</div>
    </div>
  );
}