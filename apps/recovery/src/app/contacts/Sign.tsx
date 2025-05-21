'use client';
import AddressWithChain from '@/components/AddressWithChain';
import { useAccount, useSwitchChain } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import React from 'react';
import { Button } from '@/components/ui/button';
import { getSocialRecoveryTypedData, getWalletNonce } from '@/requests/contract';
import { Address } from 'viem';
import { getConfig } from '@/wagmi';
import { mutate } from '@/requests/client';
import { MUTATION_ADD_CONTACT_SIGNATURE } from '@/requests/gqls';
import { toast } from '@/hooks/use-toast';
import { signTypedData } from 'wagmi/actions';

export default function Sign() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { recoveryRecord, backToHome } = useRecoveryRecord();

  const isSigned = (recoveryRecord?.guardianSignatures as TGuardianSignature[])?.some(
    ({ guardian }) => guardian === address?.toLowerCase()
  );

  const sendSignatureRequest = async () => {
    try {
      if (!recoveryRecord?.address || !recoveryRecord?.chainID || !recoveryRecord?.newOwners) {
        toast({
          title: 'Invalid Recovery Record',
          description: 'Missing required recovery information',
          variant: 'destructive',
        });
        return;
      }

      if (chainId !== Number(recoveryRecord.chainID)) {
        toast({
          title: 'Switch to the correct network',
          //description: 'Please approve the network switch in your wallet',
        });
        try {
          switchChain({ chainId: Number(recoveryRecord.chainID) });
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

      const nonce = await getWalletNonce(recoveryRecord.address, Number(recoveryRecord.chainID));

      if (nonce === null) {
        toast({
          title: 'Failed to get signature data, check network or RPC',
          //description: 'Please check your wallet network connection or try switching RPC nodes',
          variant: 'destructive',
        });
        return;
      }

      const typedData = await getSocialRecoveryTypedData(
        recoveryRecord.address as Address,
        Number(recoveryRecord.chainID),
        nonce,
        recoveryRecord.newOwners as Address[]
      );

      const signature = await signTypedData(getConfig(), {
        domain: typedData.domain,
        types: typedData.types,
        primaryType: 'SocialRecovery' as const,
        message: typedData.message,
        connector,
      });

      await mutate(MUTATION_ADD_CONTACT_SIGNATURE, {
        input: {
          recoveryRecordID: recoveryRecord.recoveryRecordID,
          guardian: address?.toLowerCase(),
          guardianSignature: signature,
        },
      });

      toast({
        title: 'Signed successlly',
        //description: 'Signature sent successfully',
      });

      backToHome();
    } catch (error) {
      console.error('Signature error:', error);
      toast({
        title: 'Signing failed',
        description: error instanceof Error ? error.message : 'Please try again',
        //description: (error as SafeAny)?.details || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <AddressWithChain
        className="border !p-lg border-gray-300 rounded-[16px]"
        address={address}
        chainID={Number(recoveryRecord?.chainID)}
      />

      <Button
        size="lg"
        className="w-full mt-lg shadow-none"
        disabled={!isConnected || isSigned}
        onClick={sendSignatureRequest}
      >
        {isSigned ? 'You have already signed' : 'Sign'}
      </Button>
    </div>
  );
}
