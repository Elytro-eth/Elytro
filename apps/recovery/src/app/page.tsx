'use client';

import { useRecoveryRecord } from '@/contexts';
import { LoaderCircle } from 'lucide-react';
import AddressWithChain from '@/components/AddressWithChain';
import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@/components/ui/button';
import React from 'react';
import { redirect } from 'next/navigation';
import { RecoveryStatusEn } from '@/constants/enums';
import LinkWithQuery from '@/components/LinkWithQuery';
import { InvalidRecordView } from '@/components/InvalidRecordView';

interface StepConfig {
  title: string;
  status: RecoveryStatusEn[];
  href: string;
  buttonText: string;
}

const RECOVERY_STEPS: StepConfig[] = [
  {
    title: 'Confirmations collection',
    status: [RecoveryStatusEn.WAITING_FOR_SIGNATURE],
    href: '/contacts',
    buttonText: 'Confirm Recovery',
  },
  {
    title: 'Wallet recovery',
    status: [RecoveryStatusEn.SIGNATURE_COMPLETED, RecoveryStatusEn.RECOVERY_STARTED, RecoveryStatusEn.RECOVERY_READY],
    href: '/start',
    buttonText: 'Start Recovery',
  },
];

interface IStepBlockProps {
  title: string;
  index: number;
  actionButton: React.ReactNode;
  isActive: boolean;
}

const StepBlock = ({ title, index, actionButton, isActive }: IStepBlockProps) => {
  const styles = {
    container: `flex flex-col gap-y-md p-lg rounded-lg border-1 min-w-[250px] ${
      isActive ? 'bg-gray-150 border-gray-150' : 'bg-gray-0 border-gray-300'
    }`,
    index: `text-tiny-bold text-center size-5 border-[1.5px] rounded-full ${
      isActive ? 'border-gray-900 text-gray-900' : 'border-gray-450 text-gray-450'
    }`,
    title: `text-small-bold text-nowrap ${isActive ? 'text-gray-900' : 'text-gray-450'}`,
    description: `text-tiny whitespace-pre-wrap ${isActive ? 'text-gray-450' : 'text-gray-300'}`,
  };

  return (
    <div className={styles.container}>
      <div className={styles.index}>{index}</div>
      <div className="flex flex-col gap-y-2xs">
        <div className={styles.title}>{title}</div>
        <div className={styles.description}></div>
      </div>
      {actionButton}
    </div>
  );
};

export default function Home() {
  const { status, loading, address, chainId, error } = useRecoveryRecord();

  if (loading) {
    return (
      <div className="my-auto flex flex-col items-center justify-center gap-y-lg">
        <div className="bg-blue rounded-pill p-md">
          <LoaderCircle className="size-12 animate-spin" stroke="#fff" strokeOpacity={0.9} />
        </div>
        <div className="text-bold-body">Fetching...</div>
        <div className="text-tiny text-gray-600">It may take a while for us to gather everything from the chain</div>
      </div>
    );
  }

  if (error) {
    return <InvalidRecordView />;
  }

  if (status === RecoveryStatusEn.RECOVERY_COMPLETED) {
    redirect('/finished');
  }

  return (
    <ContentWrapper title="Wallet recovery for">
      <div className="flex flex-col gap-xl items-center">
        <AddressWithChain className="bg-gray-150 w-fit" address={address!} chainID={chainId!} />

        <div className="flex flex-row gap-4 justify-between">
          {RECOVERY_STEPS.map((step, index) => {
            const isActive = status !== null && step.status.includes(status!);
            return (
              <StepBlock
                key={step.title}
                index={index + 1}
                title={step.title}
                isActive={isActive}
                actionButton={
                  <Button
                    className={!isActive ? 'border-gray-450 border-1 text-gray-600 bg-gray-0 shadow-none' : ''}
                    disabled={!isActive}
                  >
                    <LinkWithQuery href={step.href}>{step.buttonText}</LinkWithQuery>
                  </Button>
                }
              />
            );
          })}
        </div>
      </div>
    </ContentWrapper>
  );
}
