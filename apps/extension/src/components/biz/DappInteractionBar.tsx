import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ELYTRO_APP_DATA } from '@/constants/dapps';

interface DappInteractionBarProps {
  dapp: TDAppInfo;
  title: string;
}

export default function DappInteractionBar({ dapp, title }: DappInteractionBarProps) {
  return (
    <div className="flex flex-col items-center py-6">
      {/* dapp logo overlap with Elytro logo */}
      <div className="relative flex items-center justify-center mb-2 w-28 h-16">
        <Avatar className="size-16 border border-gray-200 left-0 absolute">
          <AvatarImage src={ELYTRO_APP_DATA.icon} alt={`${ELYTRO_APP_DATA.name} logo`} />
          <AvatarFallback>Elytro</AvatarFallback>
        </Avatar>
        <Avatar className="size-16 border border-gray-200 absolute right-0 z-10 bg-white">
          <AvatarImage src={dapp.icon} alt={`${dapp.name} logo`} />
          <AvatarFallback>{dapp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-gray-400 text-xs">{dapp.origin}</div>
    </div>
  );
}
