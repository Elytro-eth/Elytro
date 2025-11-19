import { useToast } from '@/hooks/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import iconSuccess from '@/assets/toast/success.svg';
import iconError from '@/assets/toast/error.svg';

const IconsMap = {
  default: undefined,
  constructive: iconSuccess,
  destructive: iconError,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="down" duration={1500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant ? IconsMap[variant] : null;
        return (
          <Toast key={id} variant={variant} {...props}>
            {icon && (
              <div className="w-5 flex-shrink-0">
                <img src={icon} className="w-5 h-5" />
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
