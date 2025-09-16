'use client';

import { useRecoveryRecord } from '@/contexts';
import { LoaderCircle, Check } from 'lucide-react';
import AddressWithChain from '@/components/AddressWithChain';
import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@/components/ui/button';
import React from 'react';
import { redirect } from 'next/navigation';
import { RecoveryStatusEn } from '@/constants/enums';
import LinkWithQuery from '@/components/LinkWithQuery';
import { InvalidRecordView } from '@/components/InvalidRecordView';
import { SidebarStepper } from '@/components/SidebarStepper';

interface StepConfig {
  title: string;
  status: RecoveryStatusEn[];
  href: string;
  buttonText: string;
}

const RECOVERY_STEPS: StepConfig[] = [
  {
    title: 'Collect confirmations',
    status: [RecoveryStatusEn.WAITING_FOR_SIGNATURE],
    href: '/contacts',
    buttonText: 'Confirm Recovery',
  },
  {
    title: 'Recover wallet',
    status: [RecoveryStatusEn.SIGNATURE_COMPLETED, RecoveryStatusEn.RECOVERY_STARTED, RecoveryStatusEn.RECOVERY_READY],
    href: '/start',
    buttonText: 'Start Recovery',
  },
];

interface IStepBlockProps {
  title: string;
  actionButton: React.ReactNode;
  isActive: boolean;
}

const StepBlock = ({ title, actionButton, isActive }: IStepBlockProps) => {
  const styles = {
    container: `flex flex-row p-lg rounded-lg border-1 min-w-[250px] justify-between items-center gap-4 ${
      isActive ? 'bg-gray-150 border-gray-150' : 'bg-gray-0 border-gray-300'
    }`,
    title: `text-small-bold text-nowrap ${isActive ? 'text-gray-900' : 'text-gray-450'}`,
    description: `text-tiny whitespace-pre-wrap ${isActive ? 'text-gray-450' : 'text-gray-300'}`,
  };

  return (
    <div className={styles.container}>
      <div className="flex direction-row gap-2 flex-1">
        <div className={styles.title}>{title}</div>
      </div>
      {actionButton}
    </div>
  );
};

export default function Home() {
  const { status, loading, address, chainId, error } = useRecoveryRecord();

  const getCurrentStep = () => {
    if (error) return 1; // Invalid URL
    if (status === RecoveryStatusEn.WAITING_FOR_SIGNATURE) return 2; // Collect confirmations
    if (
      [
        RecoveryStatusEn.SIGNATURE_COMPLETED,
        RecoveryStatusEn.RECOVERY_STARTED,
        RecoveryStatusEn.RECOVERY_READY,
        RecoveryStatusEn.RECOVERY_COMPLETED,
      ].includes(status!)
    )
      return 3; // Recover wallet to Recovery successful
    return 1; // Default to Step 1
  };

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

  if (status === RecoveryStatusEn.RECOVERY_COMPLETED) {
    redirect('/finished');
  }

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-row gap-8 items-start">
        <div className="bg-white rounded-xl p-0 flex items-center min-w-[260px]">
          <SidebarStepper currentStep={getCurrentStep()} />
        </div>
        {error ? (
          <InvalidRecordView />
        ) : (
          <ContentWrapper title="Wallet recovery for">
            <div className="flex flex-col gap-xl items-left">
              <AddressWithChain className="bg-gray-150 w-fit" address={address!} chainID={chainId!} />

              <div className="flex flex-col gap-4 justify-between w-full">
                {RECOVERY_STEPS.map((step) => {
                  const isActive = status !== null && step.status.includes(status!);
                  const buttonText =
                    getCurrentStep() === 3 && step.title === 'Collect confirmations' ? 'Completed' : step.buttonText;
                  return (
                    <StepBlock
                      key={step.title}
                      title={step.title}
                      isActive={isActive}
                      actionButton={
                        <Button
                          className={!isActive ? 'border-gray-450 border-1 text-gray-600 bg-gray-0 shadow-none' : ''}
                          disabled={!isActive}
                        >
                          <LinkWithQuery href={step.href}>
                            {getCurrentStep() === 3 && step.title === 'Collect confirmations' && (
                              <Check className="w-4 h-4 mr-2 stroke-gray-400 inline" />
                            )}
                            {buttonText}
                          </LinkWithQuery>
                        </Button>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </ContentWrapper>
        )}
      </div>
    </div>
  );
}
