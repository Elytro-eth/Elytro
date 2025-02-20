import PasswordInput from '@/components/ui/PasswordInputer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface IProps {
  open: boolean;
  handleOnOpenChange: () => void;
}

export default function ChangePasswordModal({
  open,
  handleOnOpenChange,
}: IProps) {
  const { wallet } = useWallet();
  const handleCheckPassword = async (password: string) => {
    const locked = await wallet.unlock(password);
    return !locked;
  };
  const passwordForm = z
    .object({
      oldPassword: z.string().refine(handleCheckPassword, {
        message: 'The passcode is incorrect',
      }),
      password: z
        .string()
        .min(6, {
          message:
            'The passcode should be more than 6 characters and include more than 1 capitalized letter.',
        })
        .superRefine((value, ctx) => {
          const oldPassword = form.getValues('oldPassword');
          const confirmPassword = form.getValues('confirm');
          if (!/[A-Z]/.test(value)) {
            ctx.addIssue({
              code: 'custom',
              message:
                'The passcode should include more than 1 capitalized letter.',
            });
          }
          if (value === oldPassword) {
            ctx.addIssue({
              code: 'custom',
              message:
                'The new passcode should be different from the old passcode',
            });
          }
          if (confirmPassword && confirmPassword !== value) {
            ctx.addIssue({
              code: 'custom',
              message: 'Passcode do not match confirm passcode',
            });
          }
        }),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Passwords don't match",
      path: ['confirm'], // path of error
    });
  const form = useForm<z.infer<typeof passwordForm>>({
    resolver: zodResolver(passwordForm),
    mode: 'onBlur',
  });
  const handleConfirm = async () => {
    try {
      const data = form.getValues();
      await wallet.changePassword(data.oldPassword, data.password);
      toast({
        title: 'Passcode changed',
        description: 'Your passcode has been changed successfully',
      });
      await wallet.lock();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while changing the passcode',
      });
      console.error(error);
    }
  };
  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="h-screen">
        <DialogHeader>
          <DialogTitle>Change passcode</DialogTitle>
          <DialogDescription>
            <Form {...form}>
              <form className="space-y-3xl mt-4">
                <div className="space-y-sm">
                  <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PasswordInput
                            field={field}
                            placeholder="Enter old passcode"
                          />
                        </FormControl>
                        <FormMessage className="text-left" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PasswordInput
                            field={field}
                            placeholder="Enter new passcode"
                          />
                        </FormControl>
                        <FormMessage className="text-left" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PasswordInput
                            field={field}
                            placeholder="Repeat new passcode"
                          />
                        </FormControl>
                        <FormMessage className="text-left" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>

            <div className="w-full flex justify-between gap-lg mt-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleOnOpenChange}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={!form.formState.isValid}
              >
                Confirm
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
