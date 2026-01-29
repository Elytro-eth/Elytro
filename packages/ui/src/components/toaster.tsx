'use client';

import { useToast } from '../hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import toastSuccessIcon from '../assets/toast/success.svg';
import toastErrorIcon from '../assets/toast/error.svg';

const IconsMap = {
  default: undefined,
  constructive: toastSuccessIcon,
  destructive: toastErrorIcon,
};

// Handle both Vite (returns URL string) and Next.js (returns object with src)
function getIconSrc(icon: string | { src: string }): string {
  return typeof icon === 'string' ? icon : icon.src;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="down" duration={1500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant ? IconsMap[variant as keyof typeof IconsMap] : null;
        return (
          <Toast key={id} variant={variant} {...props}>
            {icon && (
              <div className="w-5 flex-shrink-0">
                <img src={getIconSrc(icon)} alt="" className="w-5 h-5" width={20} height={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
