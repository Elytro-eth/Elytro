import { useApproval } from '@/contexts/approval-context';
import { Card, CardContent, CardFooter, CardHeader, Button, Spin } from '@elytro/ui';
import { ethErrors } from 'eth-rpc-errors';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import { SUPPORTED_CHAINS, ChainOperationEn, TChainItem } from '@/constants/chains';
import DappInteractionBar from '@/components/biz/DappInteractionBar';
import { useEffect, useState } from 'react';
import ChainAccountsDropdown from '@/components/biz/ChainAccountsDropdown.tsx';

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
  const { reloadAccount } = useAccount();
  const { approval, reject, resolve } = useApproval();
  const [selectedAccount, setSelectedAccount] = useState<TAccountInfo>();

  useEffect(() => {
    reloadAccount();
  }, []);

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
        await wallet.switchAccount(selectedAccount!);
        await reloadAccount();
        resolve();
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
    <Card className="w-full min-h-full p-sm flex flex-col ">
      <CardHeader className="text-center ">
        <DappInteractionBar dapp={dApp} title={`Connect to app`} />
        <div className="elytro-text-body">
          <span className="font-bold">
            Please {method} to the{' '}
            {chainName || SUPPORTED_CHAINS.find((chain) => chain.id === Number(targetChainId))?.name} network
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full p-3 text-sm space-y-6 mx-lg my-md">
        {/* Description of the chain change */}
        {method === ChainOperationEn.Switch && (
          <div className="space-y-4 flex flex-col items-center">
            <ChainAccountsDropdown
              chainId={Number(targetChainId)}
              onSelect={setSelectedAccount}
              selectedAccount={selectedAccount}
            />
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

      <CardFooter className="grid grid-cols-2 gap-4 mt-8">
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleConfirm}
          disabled={method === ChainOperationEn.Switch && !selectedAccount}
        >
          {method.charAt(0).toUpperCase() + method.slice(1)}
        </Button>
      </CardFooter>
    </Card>
  );
}
