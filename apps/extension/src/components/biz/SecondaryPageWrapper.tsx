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
  /**
   * Enable Guide mode (removes padding, overlays header for full-bleed background)
   * @default false
   */
  isGuide?: boolean;
  /**
   * Overlay header on top of content (useful for headers over background images)
   * @default false
   */
  overlayHeader?: boolean;
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
  overlayHeader = false,
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
      <div
        className={cn(
          'flex flex-col flex-grow w-full min-h-full bg-white rounded-sm pb-2xl',
          isGuide ? '' : 'p-lg',
          overlayHeader ? 'relative' : ''
        )}
      >
        {/* Header: back button, title, close button */}
        <div
          className={cn(
            'flex flex-row items-center justify-center relative pb-lg mb-sm',
            isGuide ? 'pt-lg px-lg' : '',
            overlayHeader ? 'absolute top-0 left-0 right-0 z-10 mb-0' : ''
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
