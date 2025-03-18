'use client';

import { useRecoveryRecord } from '@/contexts';
import { LoaderCircle } from 'lucide-react';
import AddressWithChain from '@/components/AddressWithChain';
import ContentWrapper from '@/components/ContentWrapper';
import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { TRecoveryStatus } from '@/constants/enums';
import LinkWithQuery from '@/components/LinkWithQuery';

interface IStepBlockProps {
  title: string;
  description: string;
  index: number;
  actionButton: React.ReactNode;
  variant: 'available' | 'unavailable';
}

const StepBlock = ({
  title,
  description,
  index,
  actionButton,
  variant,
}: IStepBlockProps) => {
  const bgColor = variant === 'available' ? 'bg-gray-150' : 'bg-gray-0';
  const borderColor =
    variant === 'available' ? 'border-gray-150' : 'border-gray-300';
  const subborderColor =
    variant === 'available' ? 'border-gray-900' : 'border-gray-450';
  const textColor = variant === 'available' ? 'text-gray-900' : 'text-gray-450';
  const subtextColor =
    variant === 'available' ? 'text-gray-450' : 'text-gray-300';

  return (
    <div
      className={`flex flex-col gap-y-md p-lg rounded-lg border-1 ${bgColor} ${borderColor} max-w-[248px]`}
    >
      <div
        className={`text-tiny-bold text-center size-5 border-[1.5px] ${subborderColor} ${textColor} rounded-full`}
      >
        {index}
      </div>
      <div className="flex flex-col gap-y-2xs">
        <div className={`text-small-bold ${textColor} text-nowrap`}>
          {title}
        </div>
        <div
          className={`text-tiny text-gray-450 ${subtextColor} whitespace-pre-wrap`}
        >
          {description}
        </div>
      </div>
      {actionButton}
    </div>
  );
};

export default function Home() {
  const { recoveryRecord, loading, getRecoveryRecord } = useRecoveryRecord();

  useEffect(() => {
    getRecoveryRecord();
  }, []);

  if (loading) {
    return (
      <div className="my-auto flex flex-col items-center justify-center gap-y-sm">
        <div className="bg-blue rounded-pill p-md">
          <LoaderCircle
            className="size-12 animate-spin"
            stroke="#fff"
            strokeOpacity={0.9}
          />
        </div>
        <div className="text-bold-body">Fetching recovery details...</div>
      </div>
    );
  }

  if (
    recoveryRecord?.status === TRecoveryStatus.RECOVERY_COMPLETED ||
    recoveryRecord?.status === TRecoveryStatus.RECOVERY_CANCELED
  ) {
    redirect('/finished');
  }

  return (
    <ContentWrapper title="Account recovery for">
      <div className="flex flex-col gap-xl items-center">
        <AddressWithChain
          className="bg-gray-150 w-fit "
          address={recoveryRecord?.address}
          chainID={Number(recoveryRecord?.chainID)}
        />

        <div className="flex flex-row gap-x-2 justify-between">
          <StepBlock
            index={1}
            title="Sign the recovery"
            description="A minimum number of signatures are needed for recovery"
            variant="available"
            actionButton={
              <Button
                disabled={
                  recoveryRecord?.status !==
                  TRecoveryStatus.WAITING_FOR_SIGNATURE
                }
              >
                <LinkWithQuery href="/contacts">Sign</LinkWithQuery>
              </Button>
            }
          />
          <StepBlock
            index={2}
            title="Begin & Complete recovery"
            description="48 hours security time is required after you begin the recovery"
            variant="unavailable"
            actionButton={
              <Button
                className="border-gray-450 border-1 text-gray-600 bg-gray-0 shadow-none"
                disabled={
                  recoveryRecord?.status !== TRecoveryStatus.SIGNATURE_COMPLETED
                }
              >
                <LinkWithQuery href="/start">Begin recovery</LinkWithQuery>
              </Button>
            }
          />
        </div>
      </div>
    </ContentWrapper>
  );

  // // TODO: replace this <ProcessingTip/> once the component has been extracted to shared-components project
  // return (
  //   <ContentWrapper>
  //     <div className="flex flex-col items-center gap-y-lg">
  //       <svg
  //         xmlns="http://www.w3.org/2000/svg"
  //         width="100"
  //         height="100"
  //         viewBox="0 0 100 100"
  //         fill="none"
  //       >
  //         <path
  //           d="M49.6667 91.3333C72.6785 91.3333 91.3333 72.6785 91.3333 49.6667C91.3333 26.6548 72.6785 8 49.6667 8C26.6548 8 8 26.6548 8 49.6667C8 72.6785 26.6548 91.3333 49.6667 91.3333Z"
  //           fill="#234759"
  //         />
  //         <path
  //           d="M32 50L44 62L68 38"
  //           stroke="#CEF2B9"
  //           strokeWidth="6"
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //         />
  //       </svg>

  //       <div className="flex flex-col items-center gap-y-sm text-center">
  //         <h1 className="text-title">Recovery already in progress</h1>
  //         <p className="text-smaller text-gray-600">
  //           Other contacts are assisting your friend with account recovery.
  //           <br />
  //           No further action required.
  //         </p>
  //       </div>

  //       <Button size="lg">
  //         <Link href="/start">Recovery status</Link>
  //       </Button>
  //     </div>
  //   </ContentWrapper>
  // );
}
