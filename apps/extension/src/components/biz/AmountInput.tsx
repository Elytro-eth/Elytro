import { Input } from '@/components/ui/input';
import { ArrowRightLeftIcon } from 'lucide-react';
import { FieldValues } from 'react-hook-form';
import { cn } from '@/utils/shadcn/utils';
import { useMemo } from 'react';

export default function AmountInput({
  field,
  isDisabled,
}: {
  field: FieldValues;
  isDisabled: boolean;
}) {
  const dynamicFontSize = useMemo(
    () => (field.value?.length > 10 ? 'text-lg' : 'text-xl'),
    [field.value]
  );

  return (
    <div className="bg-white px-2 py-3 rounded-md flex flex-row items-center">
      <Input
        {...field}
        className={cn('border-none', dynamicFontSize, 'font-bold')}
        placeholder="0"
        disabled={isDisabled}
      />
      <div className="bg-gray-300 p-2 rounded-sm">
        <ArrowRightLeftIcon className="w-4 h-4" />
      </div>
    </div>
  );
}
