import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface ILabelDialogProps {
  onSave: (contact: TRecoveryContact) => void;
}

export interface ILabelDialogRef {
  open: (contact: TRecoveryContact) => void;
}

const LabelDialog = forwardRef<ILabelDialogRef, ILabelDialogProps>(({ onSave }, ref) => {
  const [label, setLabel] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const contactRef = useRef<TRecoveryContact | null>(null);

  const handleClose = () => {
    setLabel('');
    setIsOpen(false);
    contactRef.current = null;
  };

  const handleSave = () => {
    if (contactRef.current) {
      onSave({
        address: contactRef.current.address,
        label: label,
      });
    }
    handleClose();
  };

  useImperativeHandle(ref, () => ({
    open: (contact: TRecoveryContact) => {
      setLabel(contact.label || '');
      contactRef.current = contact;
      setIsOpen(true);
    },
  }));

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="mx-auto max-w-md">
        <DialogHeader>
          <DialogTitle>Add a label</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-gray-600">
          Labels are saved locally and not on chain
        </DialogDescription>

        <Input
          placeholder="Label"
          className="bg-gray-150 mt-2"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <div className="mt-4 flex w-full justify-between gap-2">
          <Button variant="tertiary" size="small" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="w-full" size="small" onClick={handleSave}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

LabelDialog.displayName = 'LabelDialog';

export default LabelDialog;
