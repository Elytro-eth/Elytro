import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';
import PasswordInput from '@/components/ui/PasswordInputer';

const passwordForm = z
  .object({
    password: z
      .string()
      .min(6, {
        message:
          'The password should be more than 6 characters and include more than 1 capitalized letter.',
      })
      .refine((value) => /[A-Z]/.test(value), {
        message: 'The password should include more than 1 capitalized letter.',
      }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ['confirm'], // path of error
  });

interface PasswordSetterProps {
  loading: boolean;
  onSubmit: (pwd: string) => void;
}

export function PasswordSetter({ onSubmit, loading }: PasswordSetterProps) {
  const form = useForm<z.infer<typeof passwordForm>>({
    resolver: zodResolver(passwordForm),
    mode: 'onChange',
  });
  const [isPwdVisible, setIsPwdVisible] = useState(false);

  const handleSubmit = async (data: z.infer<typeof passwordForm>) => {
    onSubmit(data.password);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full space-y-3xl"
      >
        <div className="space-y-sm">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    field={field}
                    disabled={loading}
                    placeholder="Enter password"
                    onPwdVisibleChange={setIsPwdVisible}
                  />
                </FormControl>

                {form.formState.errors.password ? (
                  <FormMessage />
                ) : (
                  <FormDescription>
                    The password should be more than 6 characters and include
                    more than 1 capitalized letter.
                  </FormDescription>
                )}
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
                    disabled={loading}
                    placeholder="Repeat password"
                    showEye={false}
                    outerPwdVisible={isPwdVisible}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full h-14"
          disabled={loading}
          size="large"
        >
          {loading ? 'Creating...' : 'Next'}
        </Button>
      </form>
    </Form>
  );
}
