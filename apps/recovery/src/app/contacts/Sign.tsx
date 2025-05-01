'use client';
import AddressWithChain from '@/components/AddressWithChain';
import { useAccount, useSwitchChain } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import React from 'react';
import { Button } from '@/components/ui/button';
import { getSocialRecoveryTypedData, getWalletNonce } from '@/requests/contract';
import { signTypedData } from 'wagmi/actions';
import { Address } from 'viem';
import { getConfig } from '@/wagmi';
import { mutate } from '@/requests/client';
import { MUTATION_ADD_CONTACT_SIGNATURE } from '@/requests/gqls';
import { toast } from '@/hooks/use-toast';

export default function Sign() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { recoveryRecord, backToHome } = useRecoveryRecord();

  const isSigned = (recoveryRecord?.guardianSignatures as TGuardianSignature[])?.some(
    ({ guardian }) => guardian === address?.toLowerCase()
  );

  const sendSignatureRequest = async () => {
    try {
      if (chainId !== Number(recoveryRecord?.chainID)) {
        toast({
          title: 'Switch to the correct chain',
          description: 'Please approve the chain switch in your wallet',
        });
        switchChain({ chainId: Number(recoveryRecord?.chainID) });
      }

      const nonce = await getWalletNonce(recoveryRecord?.address, Number(recoveryRecord?.chainID));

      if (nonce === null) {
        toast({
          title: 'Failed to Get Signature Data',
          description: 'Please check your wallet network connection or try switching RPC nodes',
          variant: 'destructive',
        });
        return;
      }

      const signature = await signTypedData(getConfig(), {
        ...(await getSocialRecoveryTypedData(
          recoveryRecord?.address as Address,
          Number(recoveryRecord?.chainID),
          nonce,
          recoveryRecord?.newOwners as []
        )),
        connector,
      } as SafeAny);

      if (signature) {
        await mutate(MUTATION_ADD_CONTACT_SIGNATURE, {
          input: {
            recoveryRecordID: recoveryRecord?.recoveryRecordID,
            guardian: address?.toLowerCase(),
            guardianSignature: signature,
          },
        });
      }

      toast({
        title: 'Success',
        description: 'Signature sent successfully',
      });

      backToHome();
    } catch (error) {
      toast({
        title: 'Failed to sign',
        description: (error as SafeAny)?.details || 'Please try again',
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
