import { ENCOURAGE_DAPPS } from '@/constants/dapps';
import { safeOpen } from '@/utils/safeOpen';

export default function Apps() {
  const handleOpenDapp = (url: string) => {
    safeOpen(url);
  };

  return (
    <div className="flex flex-col px-lg">
      <div className="flex flex-wrap gap-x-sm gap-y-sm w-full min-h-full">
        {ENCOURAGE_DAPPS.map((dapp) => (
          // 1 row 3 items
          <div
            key={dapp.name}
            onClick={() => handleOpenDapp(dapp.url)}
            className="flex flex-col flex-1 cursor-pointer hover:bg-gray-150 p-lg rounded-md border border-gray-200"
          >
            <img src={dapp.icon} alt={dapp.name} className="size-10 mb-sm" />
            <div className="elytro-text-small-bold">{dapp.label}</div>
            <div className="elytro-text-tiny-body text-gray-500">{dapp.name}</div>
          </div>
        ))}
      </div>
      <div className="elytro-text-tiny-body mt-2xl text-center text-gray-600">
        Our favorite apps that work well with Elytro
      </div>
    </div>
  );
}
