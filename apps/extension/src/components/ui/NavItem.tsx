import { RedDot } from './RedDot';
import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';
import { ChevronRight } from 'lucide-react';

interface INavItemProps {
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
  value?: string;
  showRedDot?: boolean;
}

const NavItem = ({ icon: Icon, label, path, onClick, showRedDot, value }: INavItemProps) => (
  <div
    onClick={onClick ?? (path ? () => navigateTo('side-panel', path as SidePanelRoutePath) : undefined)}
    className="flex text-base font-normal items-center justify-between bg-gray-50 hover:bg-gray-150 relative cursor-pointer p-lg border-b border-gray-300 last:border-b-0 first:rounded-t-md last:rounded-b-md"
  >
    <div className="flex flex-row items-center hover:text-black-blue ">
      <Icon className="size-[18px] mr-3" />
      {label}
    </div>

    <div className="flex items-center gap-x-2">
      {value && <div className="text-gray-500 text-sm">{value}</div>}
      {showRedDot && <RedDot size="normal" />}
      <ChevronRight className="size-5 stroke-gray-600" />
    </div>
  </div>
);

export default NavItem;
