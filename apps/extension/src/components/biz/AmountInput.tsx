import { Input } from '@/components/ui/input';
// import { ArrowRightLeftIcon } from 'lucide-react';
import { FieldValues } from 'react-hook-form';
import { cn } from '@/utils/shadcn/utils';
import { memo, useCallback, useState, useEffect } from 'react';

interface AmountInputProps {
  field: FieldValues;
  isDisabled: boolean;
  // onClickSwap?: () => void;
}

const AmountInput = memo(({ field, isDisabled }: AmountInputProps) => {
  const [fontSize, setFontSize] = useState('text-xl');

  useEffect(() => {
    if (!field.value) {
      setFontSize('text-xl');
      return;
    }

    const length = field.value.length;
    if (length > 20) {
      setFontSize('text-sm');
    } else if (length > 15) {
      setFontSize('text-lg');
    } else {
      setFontSize('text-xl');
    }
  }, [field.value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        field.onChange(value.trim());
      }
    },
    [field]
  );

  // const handleSwap = useCallback(() => {
  //   if (onClickSwap && !isDisabled) {
  //     onClickSwap();
  //   }
  // }, [onClickSwap, isDisabled]);

  return (
    <div className="bg-white px-2 py-3 rounded-md flex flex-row items-center relative">
      <Input
        {...field}
        onChange={handleChange}
        className={cn('border-none', fontSize, 'font-bold pr-12')}
        placeholder="0"
        disabled={isDisabled}
        type="text"
        inputMode="decimal"
      />

      {/* <div
          className={cn(
            'bg-gray-300 p-2 rounded-sm cursor-pointer hover:bg-gray-400 transition-colors',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleSwap}
        >
          <ArrowRightLeftIcon className="w-4 h-4" />
        </div> */}
    </div>
  );
});

AmountInput.displayName = 'AmountInput';

export default AmountInput;
