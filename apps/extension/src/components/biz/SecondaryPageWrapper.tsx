import { X, ArrowLeft } from 'lucide-react';
import { navigateTo } from '@/utils/navigation';
import { cn } from '@/utils/shadcn/utils';
import React, { PropsWithChildren } from 'react';
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
}: ISecondaryPageWrapperProps) {
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
    <div className={cn('w-full min-h-full bg-gray-150 p-sm', className)}>
      <div className="flex flex-col flex-grow w-full min-h-full bg-white p-lg pt-0 rounded-sm">
        {/* Header: back button, title, close button */}
        <div className="flex flex-row items-center justify-center relative py-lg mb-sm">
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
