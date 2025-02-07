'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';

import { X } from 'lucide-react';
import AddressWithChain from './AddressWithChain';
import { toast } from '@/hooks/use-toast';
import { useRecoveryRecord } from '@/contexts';
import { isConnectedAccountAContact } from '@/lib/contact';

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
      <Image
        src={
          connector?.icon || `https://placehold.co/24x24?text=${connector.name}`
        }
        alt={connector.name}
        className="rounded-full size-6"
        width={24}
        height={24}
      />
      <span>{connector.name}</span>
    </div>
  );
};

export default function ConnectControl() {
  const [showDialog, setShowDialog] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { recoveryRecord } = useRecoveryRecord();

  const { disconnect } = useDisconnect();

  const dividedConnectors = useMemo(() => {
    return connectors.reduce(
      (acc, connector) => {
        if (connector.type === 'injected') {
          acc.injectedConnectors.push(connector);
        } else {
          acc.otherConnectors.push(connector);
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

  useEffect(() => {
    if (!address || !recoveryRecord) {
      return;
    }

    if (
      isConnectedAccountAContact(
        address,
        recoveryRecord?.guardianInfo?.guardians
      )
    ) {
      toast({
        title: 'Account connected successfully',
      });
    } else {
      toast({
        title:
          'You’re not connected to the right account. Please try to switch account or client.',
        variant: 'destructive',
      });
    }
  }, [address]);

  return (
    <Dialog open={showDialog} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>
        {isConnected ? (
          <div className="flex items-center gap-2 py-sm px-md rounded-sm bg-white">
            <AddressWithChain
              address={address}
              chainID={chain?.id}
              className="!p-0"
            />
            <div className="h-4 w-[1px] bg-gray-300" />
            <X
              onClick={handleDisconnect}
              color="gray"
              className="cursor-pointer hover:shadow-md"
            />
          </div>
        ) : (
          <Button
            className="rounded-full bg-transparent hover:bg-transparent shadow-none hover:shadow-md text-dark-blue border border-gray-450"
            onClick={() => setShowDialog(true)}
          >
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select an account client</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="text-small-bold text-gray-900">Detected</div>
          {dividedConnectors.injectedConnectors.map((connector) => (
            <ConnectorItem
              key={connector.id}
              connector={connector}
              handleConnect={handleConnect}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-small-bold text-gray-900">Other</div>
          {dividedConnectors.otherConnectors.map((connector) => (
            <ConnectorItem
              key={connector.id}
              connector={connector}
              handleConnect={handleConnect}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
