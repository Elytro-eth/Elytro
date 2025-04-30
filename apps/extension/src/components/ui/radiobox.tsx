import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/utils/shadcn/utils';

// const TooltipProvider = RadioGroupPrimitive.Provider;

const RadioGroup = RadioGroupPrimitive.Root;

const RadioGroupItem = RadioGroupPrimitive.Item;

const RadioGroupIndicator = RadioGroupPrimitive.Indicator;

// const TooltipContent = React.forwardRef<
//   React.ElementRef<typeof RadioGroupPrimitive.Content>,
//   React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Content>
// >(({ className, sideOffset = 4, ...props }, ref) => (
//   <RadioGroupPrimitive.Content
//     ref={ref}
//     sideOffset={sideOffset}
//     className={cn(
//       'z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
//       className
//     )}
//     {...props}
//   />
// ));
// TooltipContent.displayName = RadioGroupPrimitive.Content.displayName;

export { RadioGroup, RadioGroupItem, RadioGroupIndicator };
