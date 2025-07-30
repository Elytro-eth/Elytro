import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useState } from 'react';
import PasswordInput from '@/components/ui/PasswordInputer';

interface PasswordSetterProps {
  loading: boolean;
  onSubmit: (pwd: string) => void;
}

export function PasswordSetter({ onSubmit, loading }: PasswordSetterProps) {
  const passwordForm = z
    .object({
      password: z
        .string()
        .min(6, {
          message: 'More than 6 characters with at least 1 capitalized letter.',
        })
        .refine((value) => /[A-Z]/.test(value), {
          message: 'More than 6 characters with at least 1 capitalized letter.',
        }),
      confirm: z.string().min(1, {
        message: 'Please repeat the passcode',
      }),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirm) {
        ctx.addIssue({
          code: 'custom',
          message: "Two passwords don't match",
          path: ['confirm'],
        });
        return;
      }
    });

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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-3xl">
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
                    placeholder="Enter passcode"
                    style={{ backgroundColor: 'white' }}
                    onPwdVisibleChange={setIsPwdVisible}
                    onChange={(e) => {
                      field.onChange(e);
                      form.trigger('confirm');
                    }}
                  />
                </FormControl>

                {form.formState.errors.password ? (
                  <FormMessage />
                ) : (
                  <FormDescription>More than 6 characters with at least 1 capitalized letter.</FormDescription>
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
                    placeholder="Repeat passcode"
                    showEye={false}
                    style={{ backgroundColor: 'white' }}
                    outerPwdVisible={isPwdVisible}
                  />
                </FormControl>

                {form.getFieldState('confirm').isTouched && form.getFieldState('confirm').error ? (
                  <FormMessage className="text-left" />
                ) : null}
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full h-14"
          disabled={loading || !form.formState.isValid}
          size="large"
        >
          {loading ? 'Creating...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
}
