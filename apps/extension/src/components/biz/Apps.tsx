import { ENCOURAGE_DAPPS } from '@/constants/dapps';
import { safeOpen } from '@/utils/safeOpen';
import { SquareArrowOutUpRight, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { getHostname } from '@/utils/format';
import { toast } from '@/hooks/use-toast';

export default function Apps() {
  const { wallet } = useWallet();
  const [connectedSites, setConnectedSites] = useState<TConnectedDAppInfo[]>([]);

  const handleOpenDapp = (url: string) => {
    safeOpen(url);
  };

  const fetchConnectedSites = async () => {
    try {
      const sites = await wallet.getConnectedSites();
      setConnectedSites(sites);
    } catch {
      setConnectedSites([]);
    }
  };

  useEffect(() => {
    fetchConnectedSites();
  }, []);

  const handleDisconnect = async (origin: string | undefined) => {
    if (!origin) return;

    try {
      await wallet.disconnectSite(origin);
      fetchConnectedSites();
      toast({
        title: 'App disconnected successfully',
        variant: 'constructive',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to disconnect app, please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col px-lg gap-y-2xl">
      <div className="relative grid grid-cols-2 flex-wrap gap-x-sm gap-y-sm w-full min-h-full">
        {ENCOURAGE_DAPPS.map((dapp) => (
          // 1 row 3 items
          <div
            key={dapp.name}
            onClick={() => handleOpenDapp(dapp.url)}
            className="relative flex flex-row gap-x-sm flex-1 cursor-pointer group hover:bg-gray-150 p-lg rounded-md border border-gray-200"
          >
            <img src={dapp.icon} alt={dapp.name} className="size-10" />
            <div className="flex flex-col flex-1">
              <div className="elytro-text-small-bold">{dapp.label}</div>
              <div className="elytro-text-tiny-body text-gray-500">{dapp.name}</div>
            </div>
            <SquareArrowOutUpRight className="hidden group-hover:block absolute right-4 size-3 stroke-gray-600" />
          </div>
        ))}
      </div>

      {connectedSites?.length > 0 && (
        <div className="flex flex-col gap-y-sm">
          <h3 className="elytro-text-small-bold text-gray-600">Connected apps</h3>
          {connectedSites.map((site) => (
            <div
              key={site.origin}
              className="flex flex-row justify-between items-center gap-sm p-lg rounded-md border border-gray-300"
            >
              <div className="flex flex-row items-center gap-x-sm">
                <img src={site.icon} alt={site.name} className="size-8 rounded-full" />
                <span className="elytro-text-bold-body">{getHostname(site.origin)}</span>
              </div>
              <Unlink className="elytro-clickable-icon" onClick={() => handleDisconnect(site.origin)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
