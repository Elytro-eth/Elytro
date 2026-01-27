'use client';
import AddressWithChain from '@/components/AddressWithChain';
import { useAccount, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApproveHashTxData } from '@/requests/contract';
import { toast } from '@/hooks/use-toast';
import { Box } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sign() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const {
    contacts,
    address: recoveryAddress,
    chainId: recoveryChainId,
    hash,
    updateContactsSignStatus,
  } = useRecoveryRecord();
  const [loading, setLoading] = useState(false);
  const processedSuccessRef = useRef<string | null>(null); // Track processed transactions

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

      // call `approveHash` method in SocialRecovery contract
      const _txHash = await sendTransactionAsync(getApproveHashTxData(hash));
      setTxHash(_txHash);

      // Don't redirect immediately, wait for transaction confirmation
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
    if (receiptStatus === 'success' && txHash && processedSuccessRef.current !== txHash) {
      // Mark this transaction as processed to prevent duplicate toasts
      processedSuccessRef.current = txHash;

      toast({
        title: 'You have confirmed the recovery successfully.',
      });
      setLoading(false);
      updateContactsSignStatus();
      // Redirect to confirmed page after successful transaction with URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      router.push(`/confirmed?${searchParams.toString()}`);
    } else if (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to send transaction',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [receiptStatus, error, router, txHash]); // Added txHash to dependencies

  return (
    <div>
      <AddressWithChain
        className="border !p-lg border-gray-300 rounded-[16px]"
        address={address}
        chainID={recoveryChainId}
        rightExtra={
          recoveryChainId === chainId ? (
            <div className="flex items-center text-tiny rounded-xs bg-green-300 px-xs py-3xs">Connected</div>
          ) : (
            <div className="flex items-center text-tiny rounded-xs bg-red-150 text-red-750 px-xs py-3xs">
              Wrong network
            </div>
          )
        }
      />

      <Button
        size="lg"
        className="w-full group mt-lg shadow-none"
        disabled={!isConnected || isSigned || loading || recoveryChainId !== chainId}
        onClick={sendSignatureRequest}
      >
        <Box className="size-4 stroke-blue-300 group-hover:stroke-blue-750" />
        {loading ? 'Confirming...' : isSigned ? 'Already confirmed' : 'Confirm Recovery'}
      </Button>
    </div>
  );
}
