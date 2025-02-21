// import { cn } from '@/lib/utils';
import React from 'react';

interface IProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  // allSteps?: number;
  // currentStep?: number;
}

export default function ContentWrapper({
  children,
  title,
  subtitle,
  // allSteps,
  // currentStep,
}: IProps) {
  return (
    <section className="mt-[15%] bg-white rounded-lg min-w-fit min-h-fit px-4xl py-3xl inline-block">
      {title && (
        <h1 className="text-title text-center mb-xl">
          {/* {allSteps && currentStep && (
            <div className="flex flex-row gap-x-sm flex-nowrap mb-lg">
              {Array.from({ length: allSteps }, (_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-full h-[1px] rounded-full min-w-28',
                    index < currentStep ? 'bg-green' : 'bg-gray-450'
                  )}
                ></div>
              ))}
            </div>
          )} */}
          {title}
        </h1>
      )}
      {subtitle && (
        <h2 className="text-bold-body text-gray-750 mb-lg">{subtitle}</h2>
      )}
      {children}
    </section>
  );
}
