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
  /**
   * Enable fade-in animation (for page transitions)
   * This makes the page fade in smoothly
   * @default true
   */
  fadeIn?: boolean;
  /**
   * Enable Guide mode (removes padding, overlays header for full-bleed background)
   * @default false
   */
  isGuide?: boolean;
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
  isGuide = false,
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
    <div className={cn('w-full min-h-full bg-green-50 p-sm', fadeIn && 'page-fade-in', className)}>
      <div
        className={cn(
          'flex flex-col flex-grow w-full min-h-full bg-white rounded-sm pb-2xl relative overflow-hidden',
          isGuide ? '' : 'p-lg'
        )}
      >
        {/* Header - absolutely positioned over content when isGuide */}
        <div
          className={cn(
            'flex flex-row items-center justify-center relative pb-lg mb-sm',
            isGuide ? 'absolute top-0 left-0 right-0 z-10 pt-lg px-lg' : ''
          )}
        >
          {showBack && (
            <ArrowLeft
              className={cn('elytro-clickable-icon absolute', isGuide ? 'left-lg' : 'left-0')}
              onClick={handleBack}
            />
          )}
          <h3 className="elytro-text-bold-body">{title}</h3>
          {closeable && (
            <X
              className={cn('elytro-clickable-icon absolute', isGuide ? 'right-lg' : 'right-0')}
              onClick={handleClose}
            />
          )}
        </div>

        {children}

        {/* Footer: fixed to bottom */}
        {footer && <div className={cn('flex w-full mt-auto mb-md', isGuide ? 'px-lg' : '')}>{footer}</div>}
      </div>
    </div>
  );
}
