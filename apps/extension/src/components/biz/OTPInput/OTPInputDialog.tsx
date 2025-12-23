import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OTPInputContent, type OTPInputProps } from './OTPInputContent';

export interface OTPInputDialogProps extends OTPInputProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OTPInputDialog({ open, onOpenChange, hookError, ...otpProps }: OTPInputDialogProps) {
  if (!hookError) {
    return null;
  }

  console.log('Elytro: OTPInputDialog render', { open, hookError });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        className="!fixed !top-4 !left-4 !right-4 !w-auto !max-w-none !translate-x-0 !translate-y-0 h-auto max-h-[80vh] overflow-y-auto data-[state=open]:!slide-in-from-top-[5%] data-[state=open]:!slide-in-from-left-0"
      >
        <OTPInputContent hookError={hookError} {...otpProps} />
      </DialogContent>
    </Dialog>
  );
}
