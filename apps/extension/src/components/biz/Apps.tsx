import { ENCOURAGE_DAPPS } from '@/constants/dapps';
import { safeOpen } from '@/utils/safeOpen';
import { SquareArrowOutUpRight, Unlink } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/contexts/wallet';
import { getHostname } from '@/utils/format';
import { toast } from '@elytro/ui';
import RuntimeMessage from '@/utils/message/runtimeMessage';
import { EVENT_TYPES } from '@/constants/events';

export default function Apps() {
  const { wallet } = useWallet();
  const [connectedSites, setConnectedSites] = useState<TConnectedDAppInfo[]>([]);

  const handleOpenDapp = (url: string) => {
    safeOpen(url);
  };

  const fetchConnectedSites = useCallback(async () => {
    try {
      const sites = await wallet.getConnectedSites();
      setConnectedSites(sites);
    } catch {
      setConnectedSites([]);
    }
  }, [wallet]);

  useEffect(() => {
    fetchConnectedSites();

    const handleConnectedSitesUpdated = () => {
      fetchConnectedSites();
    };

    RuntimeMessage.onMessage(EVENT_TYPES.UI.CONNECTED_SITES_UPDATED, handleConnectedSitesUpdated);

    return () => {
      RuntimeMessage.offMessage(handleConnectedSitesUpdated);
    };
  }, [fetchConnectedSites]);

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
            className="relative flex flex-row gap-x-sm flex-1 cursor-pointer group bg-gray-50 hover:bg-gray-150 p-lg rounded-sm"
          >
            <img src={dapp.icon} alt={dapp.name} className="size-10" />
            <div className="flex flex-col flex-1">
              <div className="elytro-text-bold-body">{dapp.label}</div>
              <div className="elytro-text-tiny-body text-gray-600">{dapp.name}</div>
            </div>
            <SquareArrowOutUpRight className="hidden group-hover:block absolute right-4 size-3 stroke-gray-600" />
          </div>
        ))}
      </div>

      {connectedSites?.length > 0 && (
        <div className="flex flex-col gap-y-sm">
          <h3 className="elytro-text-small text-gray-600">Connected apps</h3>
          {connectedSites.map((site) => (
            <div
              key={site.origin}
              className="flex flex-row justify-between items-center gap-sm p-lg rounded-md bg-gray-50 hover:bg-gray-150"
            >
              <div className="flex flex-row items-center gap-x-sm">
                <img src={site.icon} alt={site.name} className="size-8 rounded-full" />
                <span className="elytro-text-body">{getHostname(site.origin)}</span>
              </div>
              <Unlink className="elytro-clickable-icon size-4" onClick={() => handleDisconnect(site.origin)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
