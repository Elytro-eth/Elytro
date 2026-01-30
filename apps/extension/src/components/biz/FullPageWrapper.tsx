import { ArrowLeft } from 'lucide-react';
import { cn } from '@elytro/ui';
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
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  };

  return (
    <div
      className={cn(
        'elytro-gradient-bg w-full flex flex-col flex-grow items-center p-xl pt-10 relative min-h-screen',
        className
      )}
    >
      {showBack && <ArrowLeft className="elytro-clickable-icon absolute left-lg top-lg" onClick={handleBack} />}

      {children}
    </div>
  );
}
