import { cn } from '@/utils/shadcn/utils';
import { Input, InputProps } from '../ui/input';

interface LabelInputProps extends InputProps {
  label: string;
}

export function LabelInput({ label, ...rest }: LabelInputProps) {
  return (
    <div className="flex flex-col gap-y-2xs text-gray-600">
      <label className="font-small text-gray-600">{label}</label>
      <Input
        className={cn(
          'rounded-md py-md px-lg h-auto',
          'placeholder:text-gray-400 placeholder:font-normal',
          'text-gray-900 font-medium',
          rest?.className
        )}
        {...rest}
      />
    </div>
  );
}
