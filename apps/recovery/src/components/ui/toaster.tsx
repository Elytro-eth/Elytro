'use client';

import { useToast } from '@/hooks/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="w-full gap-1 flex items-baseline justify-between flex-col">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
