import * as React from 'react';

import { cn } from '../utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-sm border-input px-3 py-3 text-lg outline-gray-300 focus-visible:outline-offset-0 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-600 focus-visible:outline-blue-450 focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-150 focus-visible:bg-white',
        white: 'bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, leftIcon, rightIcon, containerClassName, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className={cn('relative w-full', containerClassName)}>
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">{leftIcon}</div>
          )}
          <input
            type={type}
            className={cn(inputVariants({ variant }), leftIcon && 'pl-12', rightIcon && 'pr-12', className)}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer [&>svg]:stroke-gray-600 [&>svg]:hover:stroke-gray-900 transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return <input type={type} className={cn(inputVariants({ variant }), className)} ref={ref} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input };
