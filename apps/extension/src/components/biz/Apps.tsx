import { ENCOURAGE_DAPPS } from '@/constants/dapps';
import { safeOpen } from '@/utils/safeOpen';
import { SquareArrowOutUpRight } from 'lucide-react';

export default function Apps() {
  const handleOpenDapp = (url: string) => {
    safeOpen(url);
  };

  return (
    <div className="flex flex-col px-lg">
      <div className="relative grid grid-cols-3 flex-wrap gap-x-sm gap-y-sm w-full min-h-full">
        {ENCOURAGE_DAPPS.map((dapp) => (
          // 1 row 3 items
          <div
            key={dapp.name}
            onClick={() => handleOpenDapp(dapp.url)}
            className="relative flex flex-col flex-1 cursor-pointer group hover:bg-gray-150 p-lg rounded-md border border-gray-200"
          >
            <img src={dapp.icon} alt={dapp.name} className="size-10 mb-sm" />
            <div className="elytro-text-small-bold">{dapp.label}</div>
            <div className="elytro-text-tiny-body text-gray-500">{dapp.name}</div>
            <SquareArrowOutUpRight className="hidden group-hover:block absolute right-4 size-3 stroke-gray-600" />
          </div>
        ))}
      </div>
      <div className="elytro-text-tiny-body mt-2xl text-center text-gray-450">
        Our favorite apps that work well with Elytro
      </div>
    </div>
  );
}
