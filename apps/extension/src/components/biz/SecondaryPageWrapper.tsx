import { X, ArrowLeft } from 'lucide-react';
import { navigateTo } from '@/utils/navigation';
import { cn } from '@/utils/shadcn/utils';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

interface ISecondaryPageWrapperProps extends PropsWithChildren {
  className?: string;
  children: React.ReactNode;
  title: string;
  closeable?: boolean;
  showBack?: boolean;
  footer?: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  /**
   * Enable fade-in animation (for page transitions)
   * This makes the page fade in smoothly
   * @default true
   */
  fadeIn?: boolean;
}

export default function SecondaryPageWrapper({
  children,
  title,
  closeable = false,
  showBack = history.length > 1,
  footer,
  onClose,
  onBack,
  className,
  fadeIn = true,
}: ISecondaryPageWrapperProps) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (fadeIn) {
      // Small delay to ensure the animation plays
      requestAnimationFrame(() => {
        setAnimationClass('page-fade-in');
      });
    }
  }, [fadeIn]);

  // If fadeIn is enabled, start with opacity 0 to prevent flash
  const initialStyle = fadeIn && !animationClass ? { opacity: 0 } : undefined;

  const handleClose = () => {
    onClose?.();
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  };

  return (
    <div className={cn('w-full min-h-full bg-fade-green p-sm', animationClass, className)} style={initialStyle}>
      <div className="flex flex-col flex-grow w-full min-h-full bg-white p-lg rounded-sm pb-2xl">
        {/* Header: back button, title, close button */}
        <div className="flex flex-row items-center justify-center relative pb-lg mb-sm">
          {showBack && <ArrowLeft className="elytro-clickable-icon absolute left-0" onClick={handleBack} />}
          <h3 className="elytro-text-bold-body">{title}</h3>
          {closeable && <X className="elytro-clickable-icon absolute right-0" onClick={handleClose} />}
        </div>

        {children}

        {/* Footer: fixed to bottom */}
        {footer && <div className="flex w-full mt-auto mb-md">{footer}</div>}
      </div>
    </div>
  );
}
