'use client';

import React, { useMemo, useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
  toast,
  ShortedAddress,
} from '@elytro/ui';

import { X } from 'lucide-react';
import { useRecoveryRecord } from '@/contexts';
import WrappedImage from './WrappedImage';
import { CONNECTOR_ICON_MAP } from '@/wagmi';
import { CHAIN_ID_TO_NAME_MAP, CHAIN_LOGOS } from '@/constants/chains';
import { useCurrentChain } from '@/hooks/use-current-chain';
import { usePathname } from 'next/navigation';

const ConnectorItem = ({
  connector,
  handleConnect,
}: {
  connector: Connector;
  handleConnect: (connector: Connector) => void;
}) => {
  return (
    <div
      onClick={() => handleConnect(connector)}
      className="rounded-md p-lg flex items-center gap-2 bg-gray-50 hover:bg-gray-150 cursor-pointer"
    >
      <WrappedImage
        src={connector?.icon || `https://placehold.co/24x24?text=${connector.name?.[0]}`}
        alt={connector.name}
        className="rounded-sm size-6"
        width={24}
        height={24}
      />
      <span>{connector.name}</span>
    </div>
  );
};

export default function ConnectControl() {
  const [showDialog, setShowDialog] = useState(false);
  const { address, isConnected } = useAccount();
  const { chainId, isWrongChain } = useCurrentChain();
  const { connectors, connectAsync: connect } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { chainId: recoveryChainId } = useRecoveryRecord();
  const pathname = usePathname();
  const { disconnect } = useDisconnect();

  const dividedConnectors = useMemo(() => {
    return connectors.reduce(
      (acc, connector) => {
        if (connector.type === 'injected') {
          acc.injectedConnectors.push(connector);
        } else {
          acc.otherConnectors.push({
            ...connector,
            icon: CONNECTOR_ICON_MAP[connector.id as keyof typeof CONNECTOR_ICON_MAP],
          });
        }
        return acc;
      },
      {
        injectedConnectors: [] as Connector[],
        otherConnectors: [] as Connector[],
      }
    );
  }, [connectors]);

  const handleConnect = (connector: Connector) => {
    connect({ connector })
      .then((res) => {
        console.log('connected', res);
        toast({
          title: 'Connected wallet successfully',
        });
        setShowDialog(false);
      })
      .catch((error) => {
        console.error(error);
        toast({
          title: 'Failed to connect wallet',
          variant: 'destructive',
        });
      });
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDialog(false);
  };

  const onDialogOpenChange = (open: boolean) => {
    if (isConnected) {
      setShowDialog(false);
    } else {
      setShowDialog(open);
    }
  };

  if (pathname !== '/start' && pathname !== '/contacts') {
    return null;
  }

  // useEffect(() => {
  //   if (!address || !recoveryRecord) {
  //     toast({
  //       title: 'Please connect your wallet first',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  const switchChain = async () => {
    if (!recoveryChainId) {
      return;
    }
    try {
      await switchChainAsync({ chainId: recoveryChainId });
      toast({
        title: 'Switched network successfully',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to switch network',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>
        {isConnected ? (
          <div className="flex items-center gap-2">
            {isWrongChain ? (
              <Button
                size="small"
                className="rounded-full font-bold shadow-none duration-0 bg-transparent hover:bg-blue-300 hover:text-blue-750 text-blue-300 bg-blue-750 hover:border-blue-300"
                onClick={switchChain}
              >
                Switch to {CHAIN_ID_TO_NAME_MAP[Number(recoveryChainId)]}
              </Button>
            ) : null}
            <div className="flex items-center gap-2 h-9 px-md rounded-sm bg-white">
              <ShortedAddress
                address={address || ''}
                chainIconUrl={chainId ? CHAIN_LOGOS[chainId] : undefined}
                className={cn('!p-0 !bg-transparent', isWrongChain && '!text-red-750 !border-red-750')}
                hideTooltip={true}
              />
              <div className="h-4 w-[1px] bg-gray-300" />
              <X onClick={handleDisconnect} color="gray" className="cursor-pointer hover:stroke-black" />
            </div>
          </div>
        ) : (
          <Button
            size="small"
            className="rounded-full font-bold shadow-none duration-0 bg-transparent hover:bg-blue-300 hover:text-blue-750 text-blue-300 bg-blue-750 hover:border-blue-300"
            onClick={() => setShowDialog(true)}
          >
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl" centered>
        <DialogHeader>
          <DialogTitle>Select a wallet client</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="text-small-bold text-gray-900">Detected</div>
          {dividedConnectors.injectedConnectors.map((connector) => (
            <ConnectorItem key={connector.id} connector={connector} handleConnect={handleConnect} />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-small-bold text-gray-900">Other</div>
          {dividedConnectors.otherConnectors.map((connector) => (
            <ConnectorItem key={connector.id} connector={connector} handleConnect={handleConnect} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
