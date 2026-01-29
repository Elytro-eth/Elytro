import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils';

const buttonVariants = cva(
  'rounded-pill inline-flex flex items-center justify-center whitespace-nowrap ring-offset-background group transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-900 hover:text-white',
        secondary: 'bg-blue-150 text-blue-600 hover:bg-blue-300',
        tertiary: 'bg-white text-gray-900 hover:bg-gray-300 hover:text-hover-tertiary-foreground ',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        // ghost: 'hover:bg-accent hover:text-accent-foreground border border-gray-450',
        link: 'text-primary underline-offset-4 hover:underline text-blue-900 hover:text-blue-600',
      },
      size: {
        regular: 'px-2xl py-lg elytro-text-bold-body',
        small: 'px-lg py-sm elytro-text-smaller-body font-bold',
        tiny: 'px-md py-2xs elytro-text-tiny-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'regular',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
