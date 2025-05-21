'use client';

import React, { useMemo, useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { X } from 'lucide-react';
import AddressWithChain from './AddressWithChain';
import { toast } from '@/hooks/use-toast';
import { useRecoveryRecord } from '@/contexts';
import WrappedImage from './WrappedImage';
import { CONNECTOR_ICON_MAP } from '@/wagmi';
import { cn } from '@/lib/utils';
import { CHAIN_ID_TO_NAME_MAP } from '@/constants/chains';
import { useCurrentChain } from '@/hooks/use-current-chain';

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
      className="rounded-md p-lg flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-150 cursor-pointer"
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
  const { connectors, connect } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { recoveryRecord } = useRecoveryRecord();

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
    connect({ connector });
    setShowDialog(false);
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

  // useEffect(() => {
  //   if (!address || !recoveryRecord) {
  //     toast({
  //       title: 'Please connect your wallet first',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   // if (
  //   //   isConnectedAccountAContact(
  //   //     address,
  //   //     recoveryRecord?.guardianInfo?.guardians
  //   //   )
  //   // ) {
  //   //   toast({
  //   //     title: 'Wallet connected successfully',
  //   //   });
  //   // } else {
  //   //   toast({
  //   //     title: 'Wallet not authorized',
  //   //     description: 'Please connect with a guardian wallet.',
  //   //     variant: 'destructive',
  //   //   });
  //   // }
  // }, [address]);

  const switchChain = async () => {
    if (!recoveryRecord?.chainID) {
      return;
    }
    try {
      await switchChainAsync({ chainId: Number(recoveryRecord.chainID) });
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
                className="rounded-full font-bold shadow-none duration-0 bg-transparent hover:bg-light-blue hover:text-dark-blue text-light-blue bg-dark-blue hover:border-light-blue"
                onClick={switchChain}
              >
                Switch to {CHAIN_ID_TO_NAME_MAP[Number(recoveryRecord?.chainID)]}
              </Button>
            ) : null}
            <div className="flex items-center gap-2 py-sm px-md rounded-sm bg-white">
              <AddressWithChain
                address={address}
                chainID={chainId}
                className={cn('!p-0', isWrongChain && '!text-red !border-red')}
              />
              <div className="h-4 w-[1px] bg-gray-300" />
              <X onClick={handleDisconnect} color="gray" className="cursor-pointer hover:stroke-black" />
            </div>
          </div>
        ) : (
          <Button
            className="rounded-full font-bold shadow-none duration-0 bg-transparent hover:bg-light-blue hover:text-dark-blue text-light-blue bg-dark-blue hover:border-light-blue"
            onClick={() => setShowDialog(true)}
          >
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
