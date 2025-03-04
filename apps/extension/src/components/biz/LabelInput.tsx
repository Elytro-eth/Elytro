import { cn } from '@/utils/shadcn/utils';
import { Input, InputProps } from '../ui/input';

interface LabelInputProps extends InputProps {
  label: string;
}

export function LabelInput({ label, ...rest }: LabelInputProps) {
  return (
    <div className="flex flex-col gap-y-2xs text-gray-600">
      <p className="elytro-text-smaller-body ">{label}</p>
      <Input
        className={cn(
          'bg-gray-150 rounded-md py-sm px-lg h-auto',
          rest?.className
        )}
        {...rest}
      />
    </div>
  );
}
