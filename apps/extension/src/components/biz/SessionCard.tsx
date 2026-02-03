import { Avatar, AvatarImage, AvatarFallback } from '@elytro/ui';
import { ELYTRO_APP_DATA } from '@/constants/dapps';
import { getHostname } from '@/utils/format';

interface ISessionCard {
  session?: TDAppInfo;
}

export default function SessionCard({ session = ELYTRO_APP_DATA }: ISessionCard) {
  const { icon, name, origin } = session;

  return (
    <div className="flex flex-col items-center gap-y-2 mb-2">
      <Avatar className="border border-gray-300 bg-white size-16 flex items-center justify-center">
        <AvatarImage src={icon} alt={`${name} logo`} className="size-12" />
        <AvatarFallback className="text-xl">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center">
        <span className="elytro-text-bold-body">{name}</span>
        <span className="elytro-text-small text-gray-450">{getHostname(origin)}</span>
      </div>
    </div>
  );
}
