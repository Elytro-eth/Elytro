import { ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/shadcn/utils';
import React, { PropsWithChildren } from 'react';

interface ISecondaryPageWrapperProps extends PropsWithChildren {
  className?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export default function FullPageWrapper({
  children,
  showBack = history.length > 1,
  onBack,
  className,
}: ISecondaryPageWrapperProps) {
  const handleBack = () => {
    onBack?.();
    history.back();
  };

  return (
    <div
      className={cn(
        'elytro-gradient-bg w-full flex flex-col flex-grow justify-center items-center p-sm relative',
        className
      )}
    >
      {showBack && (
        <ArrowLeft
          className="elytro-clickable-icon absolute left-lg top-lg"
          onClick={handleBack}
        />
      )}

      <div className="flex flex-col w-full items-center justify-center gap-y-2xl">
        {children}
      </div>
    </div>
  );
}
