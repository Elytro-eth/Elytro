'use client';

import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@/components/ui/button';
import { useRecoveryRecord } from '@/contexts';
import { toast } from '@/hooks/use-toast';
import { getConfig } from '@/wagmi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { sendTransaction } from 'wagmi/actions';
import { Box, ExternalLink, Loader2 } from 'lucide-react';
import { RecoveryStatusEn } from '@/constants/enums';
import { cn } from '@/lib/utils';

const TimeBlock = ({ time, unit }: { time: number; unit: string }) => {
  return (
    <div className="flex flex-col items-center gap-y-sm">
      <div className="text-title leading-normal text-center p-md rounded-sm bg-gray-150 w-14">
        {String(time > 0 ? time : 0).padStart(2, '0')}
      </div>
      <div className="text-tiny">{unit}</div>
    </div>
  );
};

export default function Start() {
  const { isConnected, connector, chain } = useAccount();
  const publicClient = usePublicClient();
  const router = useRouter();
  const {
    status,
    updateRecoveryStatus,
    address,
    chainId,
    hash,
    generateStartRecoveryTxData,
    generateExecuteRecoveryTxData,
    validTime,
  } = useRecoveryRecord();
  const [leftTime, setLeftTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  if (!address || !chainId || !hash) {
    router.push('/not-found');
    return null;
  }

  const openExplorer = (txHash: string) => {
    const explorerUrl = chain?.blockExplorers?.default.url;
    if (!explorerUrl) {
      toast({
        title: 'Explorer URL not found',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
      return;
    }
    window.open(`${explorerUrl}/tx/${txHash}`, '_blank', 'noopener,noreferrer');
  };

  const trackTransaction = (txHash: `0x${string}`, onSuccess?: () => void, onFailed?: () => void) => {
    setTxStatus('pending');
    toast({
      title: 'Transaction processing',
      //description: 'Please wait while we process your transaction...',
      variant: 'default',
      action: (
        <a
          className="mr-3 text-sm text-light-green flex cursor-pointer items-center"
          onClick={() => openExplorer(txHash)}
        >
          View <ExternalLink className="size-4 stroke-light-green ml-1" />
        </a>
      ),
    });

    const pollInterval = setInterval(async () => {
      try {
        if (!publicClient) {
          console.error('Public client not available');
          return;
        }

        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash,
        });

        if (receipt) {
          clearInterval(pollInterval);

          if (receipt.status === 'success') {
            setTxStatus('success');
            toast({
              title: 'Recovery completed',
              //description: 'Your wallet recovery was successful!',
              variant: 'default',
            });
            onSuccess?.();
          } else {
            setTxStatus('failed');
            toast({
              title: 'Transaction failed, try again or contact us',
              //description: 'Please try again or contact support.',
              variant: 'destructive',
            });
            onFailed?.();
          }
        }
      } catch (error) {
        console.error('Error polling transaction receipt:', error);
      }
    }, 2_000);

    return () => clearInterval(pollInterval);
  };

  const startRecovery = async () => {
    if (!isConnected) {
      toast({
        title: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const txHash = await sendTransaction(getConfig(), {
        connector,
        ...generateStartRecoveryTxData(),
      });

      trackTransaction(
        txHash,
        () => {
          // fetch recovery record until it's status is RecoveryStatusEn.READY
          const interval = setInterval(() => {
            updateRecoveryStatus();
            if (status && status === RecoveryStatusEn.RECOVERY_READY) {
              clearInterval(interval);
            }
          }, 2_000);

          return () => clearInterval(interval);
        },
        () => {
          toast({
            title: 'Failed to start recovery',
            variant: 'destructive',
            description: 'Please try again or contact support.',
          });
        }
      );
    } catch (error) {
      toast({
        title: 'Failed to start recovery',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      updateRecoveryStatus();
    }
  };

  // const { status } = useMemo(() => {
  //   const targetTime = (recoveryRecord?.validTime || 0) * 1000;
  //   let status = RecoveryStatusEn.NonStarted;

  //   if (targetTime === 0) {
  //     status = RecoveryStatusEn.NonStarted;
  //   } else if (targetTime === 1000) {
  //     status = RecoveryStatusEn.Completed;
  //   } else if (targetTime > Date.now()) {
  //     status = RecoveryStatusEn.Waiting;
  //   } else {
  //     status = RecoveryStatusEn.Ready;
  //   }

  //   return { status };
  // }, [recoveryRecord]);

  const completeRecovery = async () => {
    try {
      setIsLoading(true);
      if (!isConnected) {
        toast({
          title: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return;
      }

      const txHash = await sendTransaction(getConfig(), {
        connector,
        ...generateExecuteRecoveryTxData(),
      });

      trackTransaction(
        txHash,
        () => {
          updateRecoveryStatus();
          router.push('/finished');
        },
        () => {
          toast({
            title: 'Failed to complete recovery',
            variant: 'destructive',
            description: 'Please try again or contact support.',
          });
        }
      );
    } catch (error) {
      toast({
        title: 'Failed to complete recovery',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      updateRecoveryStatus();
    }
  };

  useEffect(() => {
    if (status === RecoveryStatusEn.RECOVERY_STARTED && validTime) {
      const targetTime = validTime * 1000;
      let animationFrameId: number;

      const updateTimer = () => {
        const currentTime = Date.now();
        const lastTime = targetTime - currentTime;

        if (lastTime > 0) {
          const hours = Math.floor(lastTime / (1000 * 60 * 60));
          const minutes = Math.floor((lastTime % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((lastTime % (1000 * 60)) / 1000);

          setLeftTime({ hours, minutes, seconds });
          animationFrameId = requestAnimationFrame(updateTimer);
        } else {
          setLeftTime({ hours: 0, minutes: 0, seconds: 0 });
          updateRecoveryStatus();
        }
      };

      animationFrameId = requestAnimationFrame(updateTimer);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [status, validTime]);

  return (
    <ContentWrapper
      // currentStep={2}
      // allSteps={3}
      title={
        [RecoveryStatusEn.SIGNATURE_COMPLETED, RecoveryStatusEn.RECOVERY_READY].includes(status || 0)
          ? 'Start Recovery'
          : 'Recovery in progress'
      }
      subtitle={
        <div className="text-center text-gray-600">
          {status === RecoveryStatusEn.SIGNATURE_COMPLETED
            ? 'Connect to a wallet to start recovery.'
            : 'Wallet access will be resumed in 48 hours.'}
        </div>
      }
    >
      {/* Count down */}
      {txStatus !== 'pending' && status !== null && status !== undefined && (
        <div
          className={cn(
            'flex flex-row my-2xl w-full justify-center gap-x-sm flex-nowrap mb-lg ',
            [RecoveryStatusEn.SIGNATURE_COMPLETED, RecoveryStatusEn.RECOVERY_READY].includes(status) && 'opacity-60'
          )}
        >
          <TimeBlock time={leftTime.hours} unit="Hours" />
          <TimeBlock time={leftTime.minutes} unit="Minutes" />
          <TimeBlock time={leftTime.seconds} unit="Seconds" />
        </div>
      )}

      {txStatus === 'pending' && (
        // Loading: waiting for transaction to be confirmed
        <div className="flex flex-col my-2xl w-full justify-center items-center gap-y-sm flex-nowrap mb-lg text-gray-300">
          <Loader2 className="size-8 animate-spin" />
          <div className="text-tiny flex flex-row items-center">Confirming transaction...</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-sm">
        {status === RecoveryStatusEn.SIGNATURE_COMPLETED ? (
          <Button
            size="lg"
            disabled={
              !isConnected || isLoading || txStatus === 'pending' || status !== RecoveryStatusEn.SIGNATURE_COMPLETED
            }
            onClick={startRecovery}
            className="w-full group"
          >
            <Box className="size-4 stroke-light-blue group-hover:stroke-dark-blue" />
            Start Recovery
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={isLoading || txStatus === 'pending' || status !== RecoveryStatusEn.RECOVERY_READY}
            onClick={completeRecovery}
            className="w-full group"
          >
            <Box className="size-4 stroke-light-blue group-hover:stroke-dark-blue" />
            Complete Recovery
          </Button>
        )}
      </div>
    </ContentWrapper>
  );
}
