'use client';

import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@/components/ui/button';
import { useRecoveryRecord } from '@/contexts';
import { toast } from '@/hooks/use-toast';
import {
  getExecuteRecoveryTxData,
  getRecoveryStartTxData,
} from '@/requests/contract';
import { getConfig } from '@/wagmi';
import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { sendTransaction } from 'wagmi/actions';

enum RecoveryStatusEn {
  NonStarted = 0, // Not started yet
  Waiting = 1, // Waiting for ok to start the recovery
  Ready = 2, // Ready to start the recovery
  Completed = 3, // Recovery completed
}

// const DELAY_TIME = 48 * 60 * 60 * 1_000; // 48 hours

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
  const { isConnected, connector } = useAccount();
  const { recoveryRecord, getRecoveryRecord } = useRecoveryRecord();
  const [leftTime, setLeftTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

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
      await sendTransaction(getConfig(), {
        connector,
        ...getRecoveryStartTxData(
          recoveryRecord!.address,
          recoveryRecord!.newOwners,
          recoveryRecord!.guardianInfo,
          recoveryRecord!.guardianSignatures
        ),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to start recovery',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      getRecoveryRecord();
    }
  };

  const { status } = useMemo(() => {
    const validTime = (recoveryRecord?.validTime || 0) * 1000;
    let status = RecoveryStatusEn.NonStarted;

    if (validTime === 0) {
      status = RecoveryStatusEn.NonStarted;
    } else if (validTime === 1) {
      status = RecoveryStatusEn.Completed;
    } else if (validTime * 1000 > Date.now()) {
      status = RecoveryStatusEn.Waiting;
    } else {
      status = RecoveryStatusEn.Ready;
    }

    return { status };
  }, [recoveryRecord]);

  const completeRecovery = async () => {
    try {
      setIsLoading(true);
      await sendTransaction(getConfig(), {
        connector,
        ...getExecuteRecoveryTxData(
          recoveryRecord!.address,
          recoveryRecord!.newOwners
        ),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to complete recovery',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      getRecoveryRecord();
    }
  };

  useEffect(() => {
    if (status === RecoveryStatusEn.Waiting) {
      const targetTime = recoveryRecord!.validTime * 1000;

      const interval = setInterval(() => {
        const lastTime = targetTime - Date.now();
        if (lastTime > 0) {
          setLeftTime({
            hours: Math.floor(lastTime / (1000 * 60 * 60)),
            minutes: Math.floor((lastTime % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((lastTime % (1000 * 60)) / 1000),
          });
        } else {
          clearInterval(interval);
          setLeftTime({ hours: 0, minutes: 0, seconds: 0 });
          getRecoveryRecord();
        }
      }, 1000);

      return () => clearInterval(interval);
    } else if (
      status === RecoveryStatusEn.Ready ||
      status === RecoveryStatusEn.NonStarted
    ) {
      setLeftTime({ hours: 48, minutes: 0, seconds: 0 });
    }
  }, [status, recoveryRecord]);

  return (
    <ContentWrapper
      // currentStep={2}
      // allSteps={3}
      title="Start Recovery"
      subtitle={
        <span
          dangerouslySetInnerHTML={{
            __html:
              'It will take effect in 48 hours. You can access your <br />wallet after the countdown.',
          }}
        />
      }
    >
      {/* Count down */}
      <div className="flex flex-row my-2xl w-full justify-center gap-x-sm flex-nowrap mb-lg">
        <TimeBlock time={leftTime.hours} unit="Hours" />
        <TimeBlock time={leftTime.minutes} unit="Minutes" />
        <TimeBlock time={leftTime.seconds} unit="Seconds" />
      </div>

      <div className="grid grid-cols-2 gap-x-sm items-center">
        <Button
          size="lg"
          variant={
            status === RecoveryStatusEn.NonStarted ? 'default' : 'outline'
          }
          disabled={isLoading || status !== RecoveryStatusEn.NonStarted}
          onClick={startRecovery}
          className="w-full"
        >
          Start Recovery
        </Button>

        <Button
          size="lg"
          variant={status === RecoveryStatusEn.Ready ? 'default' : 'outline'}
          disabled={isLoading || status !== RecoveryStatusEn.Ready}
          onClick={completeRecovery}
          className="w-full"
        >
          Complete Recovery
        </Button>
      </div>
    </ContentWrapper>
  );
}
