import { Link } from 'wouter';
import { RedDot } from './Reddot';

interface ISettingItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  showRedDot?: boolean;
}

const SettingItem = ({
  icon: Icon,
  label,
  path,
  showRedDot,
}: ISettingItemProps) => (
  <Link
    href={path}
    className="elytro-rounded-border-item-wrapper flex text-base font-normal items-center hover:bg-gray-150 relative"
  >
    <Icon className="size-5 mr-3" />
    {label}
    {showRedDot && <RedDot size="normal" className="absolute right-4" />}
  </Link>
);

export default SettingItem;
