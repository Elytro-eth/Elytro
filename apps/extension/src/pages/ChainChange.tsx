import { useApproval } from '@/contexts/approval-context';
import Spin from '@/components/ui/Spin';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ethErrors } from 'eth-rpc-errors';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import { SUPPORTED_CHAINS, ChainOperationEn, TChainItem } from '@/constants/chains';
import { getChainNameByChainId } from '@/constants/chains';

function URLSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t pt-4 max-h-32 overflow-y-auto">
      <h3 className="font-bold text-lg">{title}</h3>
      <ul className="list-disc list-inside">
        {items.length ? (
          items.map((item, index) => (
            <li key={index} className="text-blue-600 hover:underline">
              <a href={item} target="_blank" rel="noopener noreferrer">
                {item}
              </a>
            </li>
          ))
        ) : (
          <li>--</li>
        )}
      </ul>
    </div>
  );
}

export default function ChainChange() {
  const { wallet } = useWallet();
  const {
    currentAccount: { chainId },
  } = useAccount();
  const { approval, reject, resolve } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading />;
  }

  const {
    data: { dApp, chain },
  } = approval;

  const { method, chainName, chainId: targetChainId, nativeCurrency, rpcUrls, blockExplorerUrls } = chain || {};

  const handleCancel = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  const handleConfirm = async () => {
    try {
      if (method === ChainOperationEn.Switch) {
        await wallet.switchAccountByChain(Number(targetChainId));
      } else {
        const updateConfig = {} as TChainItem;

        if (chainName) updateConfig.name = chainName;
        if (nativeCurrency) updateConfig.nativeCurrency = nativeCurrency;
        if (rpcUrls?.[0]) {
          updateConfig.endpoint = rpcUrls[0];
          updateConfig.rpcUrls = {
            default: { http: rpcUrls },
          };
        }
        if (blockExplorerUrls?.[0]) {
          updateConfig.blockExplorers = {
            default: {
              name: 'Default',
              url: blockExplorerUrls[0],
            },
          };
        }
        await wallet.updateChainConfig(Number(targetChainId), updateConfig);
      }
      resolve();
    } catch (e) {
      console.error(e);
      reject(e as Error);
    }
  };

  return (
    <Card className="w-full min-h-screen h-full flex flex-col ">
      <CardHeader className="text-center ">
        <Avatar className="size-16 mt-10 relative z-0 rounded-full mx-auto mb-4 transition-transform transform hover:scale-105">
          <AvatarImage src={dApp.icon} alt={`${dApp.name} icon`} />
          <AvatarFallback>{dApp.name}</AvatarFallback>
        </Avatar>
        <div className="elytro-text-body">
          <span className="font-bold">Please {method} network</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full p-3 text-sm space-y-6 mx-lg my-md">
        {/* Description of the chain change */}
        {method === ChainOperationEn.Switch && (
          <div className="text-gray-900">
              Current network is <span className="font-bold text-gray-900">{getChainNameByChainId(chainId)}</span>. Do you want to
              switch to{' '}
              <span className="font-bold text-gray-900">
                {chainName || SUPPORTED_CHAINS.find((chain) => chain.id === Number(targetChainId))?.name}
              </span>
              ?
          </div>
        )}

        {method === ChainOperationEn.Update && (
          <div className="text-base text-gray-700 space-y-4">
            <p>
              Chain <span className="font-bold">{chainName}</span> ({targetChainId}) will be{' '}
              <span className="font-bold">updated</span> in your wallet.
            </p>
            <div className="border-t pt-4">
              <h3 className="font-bold text-lg">Native Currency</h3>
              <p>{nativeCurrency?.name || '--'}</p>
            </div>
            <URLSection title="RPC URLs" items={rpcUrls || []} />
            <URLSection title="Block Explorers" items={blockExplorerUrls || []} />
          </div>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="default" onClick={handleConfirm}>
          {method.charAt(0).toUpperCase() + method.slice(1)}
        </Button>
      </CardFooter>
    </Card>
  );
}
