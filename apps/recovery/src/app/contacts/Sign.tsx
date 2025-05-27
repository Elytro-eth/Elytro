'use client';
import AddressWithChain from '@/components/AddressWithChain';
import { useAccount, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApproveHashTxData } from '@/requests/contract';
import { toast } from '@/hooks/use-toast';

export default function Sign() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    contacts,
    address: recoveryAddress,
    chainId: recoveryChainId,
    hash,
    updateContactsSignStatus,
  } = useRecoveryRecord();
  const [loading, setLoading] = useState(false);

  const { sendTransactionAsync } = useSendTransaction();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { status: receiptStatus, error } = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  if (!recoveryAddress || !recoveryChainId || !hash) {
    return null;
  }

  const isSigned = contacts?.find((contact) => contact.address.toLowerCase() === address?.toLowerCase())?.confirmed;

  const sendSignatureRequest = async () => {
    try {
      setLoading(true);

      if (chainId !== recoveryChainId) {
        toast({
          title: 'Switch to the correct network',
        });
        try {
          switchChain({ chainId: recoveryChainId });
          // Add a small delay to ensure chain switch is complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch {
          toast({
            title: 'Failed to switch chain',
            description: 'Please manually switch to the correct network in your wallet',
            variant: 'destructive',
          });
          return;
        }
      }

      console.log('target chainId', recoveryChainId);
      console.log('current chainId', chainId);

      // call `approveHash` method in SocialRecovery contract
      const _txHash = await sendTransactionAsync(getApproveHashTxData(hash));
      setTxHash(_txHash);

      // backToHome();
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to send transaction',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (receiptStatus === 'success') {
      toast({
        title: 'You have signed the recovery successfully.',
      });
      setLoading(false);
      updateContactsSignStatus();
    } else if (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to send transaction',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [receiptStatus, error]);

  return (
    <div>
      <AddressWithChain
        className="border !p-lg border-gray-300 rounded-[16px]"
        address={address}
        chainID={recoveryChainId}
      />

      <Button
        size="lg"
        className="w-full mt-lg shadow-none"
        disabled={!isConnected || isSigned || loading}
        onClick={sendSignatureRequest}
      >
        {loading ? 'Signing...' : isSigned ? 'You have already signed' : 'Sign'}
      </Button>
    </div>
  );
}
