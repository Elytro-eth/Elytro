import { Input } from '@/components/ui/input';
import { FieldValues } from 'react-hook-form';
import { cn } from '@/utils/shadcn/utils';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { ArrowRightLeftIcon } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';

interface AmountInputProps {
  field: FieldValues;
  isDisabled: boolean;
  token: TTokenInfo;
}

enum InputMode {
  DOLLAR = 'dollar',
  TOKEN = 'token',
}

const AmountInput = memo(({ field, isDisabled, token }: AmountInputProps) => {
  const [fontSize, setFontSize] = useState('text-xl');
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TOKEN);
  const [displayValue, setDisplayValue] = useState('');

  const isInternalUpdate = useRef(false);

  const {
    tokenInfo: { tokenPrices },
  } = useAccount();

  const tokenPrice = token?.address
    ? tokenPrices.find((p) => p.address === token.address)?.price || 0
    : 0;

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (!field.value) {
      setDisplayValue('');
      return;
    }

    if (inputMode === InputMode.TOKEN) {
      setDisplayValue(field.value);
    } else {
      if (tokenPrice > 0) {
        const dollarValue = parseFloat(field.value) * tokenPrice;
        setDisplayValue(dollarValue.toFixed(2));
      } else {
        setInputMode(InputMode.TOKEN);
        setDisplayValue(field.value);
      }
    }
  }, [field.value, inputMode, tokenPrice]);

  useEffect(() => {
    if (!field.value) return;

    if (inputMode === InputMode.TOKEN) {
      setDisplayValue(field.value);
    } else if (tokenPrice > 0) {
      const dollarValue = parseFloat(field.value) * tokenPrice;
      setDisplayValue(dollarValue.toFixed(2));
    }
  }, [inputMode]);

  useEffect(() => {
    if (!displayValue) {
      setFontSize('text-xl');
      return;
    }

    const length = displayValue.length;
    if (length > 20) {
      setFontSize('text-sm');
    } else if (length > 15) {
      setFontSize('text-lg');
    } else {
      setFontSize('text-xl');
    }
  }, [displayValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setDisplayValue(value);

        if (inputMode === InputMode.TOKEN) {
          isInternalUpdate.current = true;
          field.onChange(value.trim());
        } else {
          if (tokenPrice > 0 && value !== '') {
            const tokenAmount = parseFloat(value) / tokenPrice;
            const decimals = token?.decimals || 18;
            const precision = Math.min(decimals, 8);

            isInternalUpdate.current = true;
            field.onChange(tokenAmount.toFixed(precision));
          } else if (value === '') {
            isInternalUpdate.current = true;
            field.onChange('');
          }
        }
      }
    },
    [field, inputMode, tokenPrice, token?.decimals]
  );

  const handleToggleMode = useCallback(() => {
    if (isDisabled || tokenPrice <= 0) return;

    setInputMode((prevMode) => {
      const newMode =
        prevMode === InputMode.TOKEN ? InputMode.DOLLAR : InputMode.TOKEN;

      if (field.value) {
        if (newMode === InputMode.DOLLAR && tokenPrice > 0) {
          const dollarValue = parseFloat(field.value) * tokenPrice;
          setDisplayValue(dollarValue.toFixed(2));
        } else {
          setDisplayValue(field.value);
        }
      }

      return newMode;
    });
  }, [isDisabled, tokenPrice, field.value]);

  return (
    <div className="bg-white px-2 py-3 rounded-md flex flex-row items-center relative">
      <div className="relative flex-1">
        <Input
          value={displayValue}
          onChange={handleChange}
          className={cn('border-none', fontSize, 'font-bold pr-24')}
          placeholder="0"
          disabled={isDisabled}
          type="text"
          inputMode="decimal"
        />

        <div
          className={cn(
            'z-10 absolute right-md top-1/2 -translate-y-1/2 flex items-center gap-1 px-sm py-2xs rounded bg-gray-150 cursor-pointer',
            (isDisabled || tokenPrice <= 0) && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleToggleMode}
        >
          <ArrowRightLeftIcon className="size-3" />
          <span className="text-xs font-medium">
            {inputMode === InputMode.TOKEN ? token?.symbol || 'Token' : 'USD'}
          </span>
        </div>
      </div>
    </div>
  );
});

AmountInput.displayName = 'AmountInput';

export default AmountInput;
