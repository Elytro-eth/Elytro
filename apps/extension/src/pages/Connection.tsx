import { useEffect, useState } from 'react';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useWallet } from '@/contexts/wallet';
import { Unlink } from 'lucide-react';
import { getHostname } from '@/utils/format';
import { toast } from '@/hooks/use-toast';

type TConnectedSiteItemProps = TConnectedDAppInfo & {
  onDisconnect: (origin?: string) => void;
};

const ConnectedSiteItem = ({
  origin,
  name,
  icon,
  onDisconnect,
}: TConnectedSiteItemProps) => {
  return (
    <div
      key={origin}
      className="flex flex-row justify-between items-center gap-sm p-lg rounded-md border border-gray-300"
    >
      <div className="flex flex-row items-center gap-x-sm">
        <img src={icon} alt={name} className="size-8 rounded-full" />
        <span className="elytro-text-bold-body ">{getHostname(origin)}</span>
      </div>

      <Unlink
        className="size-4 text-gray-500 cursor-pointer"
        onClick={() => onDisconnect(origin)}
      />
    </div>
  );
};

export default function Connection() {
  const { wallet } = useWallet();
  const [connectedSites, setConnectedSites] = useState<TConnectedDAppInfo[]>(
    []
  );

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
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to disconnect site',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <SecondaryPageWrapper title="Connected apps">
      {connectedSites?.length > 0 ? (
        <div className="flex flex-col gap-y-sm">
          {connectedSites.map((site) => (
            <ConnectedSiteItem
              key={site.origin}
              {...site}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center h-full">
          <p className="elytro-text-body text-gray-500 mt-10">
            No connected apps
          </p>
        </div>
      )}
    </SecondaryPageWrapper>
  );
}
