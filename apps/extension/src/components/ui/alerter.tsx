import { createContext, useContext, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@elytro/ui';

type ElytroAlertProps = {
  title: string;
  description?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
};

type IAlerterContext = {
  elytroAlert: (params: ElytroAlertProps) => void;
};

const AlerterContext = createContext<IAlerterContext>({
  elytroAlert: ({}) => {},
});

export const AlerterProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  let onCancelRef = useRef<(() => void) | null>(null);
  let onConfirmRef = useRef<(() => void) | null>(null);
  const reset = () => {
    setOpen(false);
    setTitle('');
    setDescription('');
    onCancelRef.current = null;
    onConfirmRef.current = null;
  };
  const handleCancel = () => {
    onCancelRef.current?.();
    reset();
  };
  const handleConfirm = () => {
    onConfirmRef.current?.();
    reset();
  };
  const elytroAlert = ({ title, description, onCancel, onConfirm }: ElytroAlertProps) => {
    setOpen(true);
    setTitle(title);
    setDescription(description || '');
    onCancel && (onCancelRef.current = onCancel);
    onConfirm && (onConfirmRef.current = onConfirm);
  };
  return (
    <AlerterContext.Provider
      value={{
        elytroAlert,
      }}
    >
      {open && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent className="bg-white rounded-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-between mt-2">
              <Button className="flex-1" size="small" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="flex-1" size="small" onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {children}
    </AlerterContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlerterContext);
};
