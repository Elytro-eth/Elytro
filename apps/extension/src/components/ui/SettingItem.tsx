import { RedDot } from './RedDot';
import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';

interface ISettingItemProps {
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
  value?: string;
  showRedDot?: boolean;
}

const SettingItem = ({ icon: Icon, label, path, onClick, showRedDot, value }: ISettingItemProps) => (
  <div
    onClick={onClick ?? (path ? () => navigateTo('side-panel', path as SidePanelRoutePath) : undefined)}
    className="elytro-rounded-border-item-wrapper flex text-base font-normal items-center justify-between hover:bg-gray-150 relative cursor-pointer"
  >
    <div className="flex flex-row items-center">
      <Icon className="size-5 mr-3" />
      {label}
    </div>

    {value && <div className="text-gray-500 text-sm">{value}</div>}
    {showRedDot && <RedDot size="normal" className="absolute right-4" />}
  </div>
);

export default SettingItem;
