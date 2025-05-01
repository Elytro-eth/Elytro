import { Input } from '@/components/ui/input';
import { FieldValues } from 'react-hook-form';
import { cn } from '@/utils/shadcn/utils';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpDownIcon } from 'lucide-react';
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

const INPUT_CONFIG = {
  [InputMode.DOLLAR]: {
    prefix: '$',
    postfix: '',
  },
  [InputMode.TOKEN]: {
    prefix: '',
    postfix: '',
  },
};

const AmountInput = memo(({ field, isDisabled, token }: AmountInputProps) => {
  const [fontSize, setFontSize] = useState('text-xl');
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TOKEN);
  const [eqMode, setEqMode] = useState<InputMode>(InputMode.DOLLAR);
  const [inputValue, setInputValue] = useState('');
  const [eqValue, setEqValue] = useState('');

  const isInternalUpdate = useRef(false);

  const {
    tokenInfo: { tokenPrices },
  } = useAccount();

  const tokenPrice = token?.address ? tokenPrices.find((p) => p.address === token.address)?.price || 0 : 0;

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (!field.value) {
      setInputValue('');
      return;
    }

    if (inputMode === InputMode.TOKEN) {
      setInputValue(field.value);
    } else {
      if (tokenPrice > 0) {
        const dollarValue = parseFloat(field.value) * tokenPrice;
        setInputValue(dollarValue.toFixed(2));
      } else {
        setInputMode(InputMode.TOKEN);
        setInputValue(field.value);
      }
    }
  }, [field.value, inputMode, tokenPrice]);

  useEffect(() => {
    if (!field.value) return;

    if (inputMode === InputMode.TOKEN) {
      setInputValue(field.value);
    } else if (tokenPrice > 0) {
      const dollarValue = parseFloat(field.value) * tokenPrice;
      setInputValue(dollarValue.toFixed(2));
    }
  }, [inputMode]);

  useEffect(() => {
    if (!inputValue) {
      setFontSize('text-xl');
      return;
    }

    const length = inputValue.length;
    if (length > 20) {
      setFontSize('text-sm');
    } else if (length > 15) {
      setFontSize('text-lg');
    } else {
      setFontSize('text-xl');
    }
  }, [inputValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value?.trim();

      if (value === '' || /^(?:[0-9]*\.)?[0-9]*$/.test(value)) {
        setInputValue(value);

        if (inputMode === InputMode.TOKEN) {
          isInternalUpdate.current = true;
          field.onChange(value);
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
      const newMode = prevMode === InputMode.TOKEN ? InputMode.DOLLAR : InputMode.TOKEN;

      if (field.value) {
        if (newMode === InputMode.DOLLAR && tokenPrice > 0) {
          const dollarValue = parseFloat(field.value) * tokenPrice;
          setInputValue(dollarValue.toFixed(2));
        } else {
          setInputValue(field.value);
        }
      }

      return newMode;
    });
  }, [isDisabled, tokenPrice, field.value]);

  useEffect(() => {
    setEqMode(inputMode === InputMode.TOKEN ? InputMode.DOLLAR : InputMode.TOKEN);
    if (tokenPrice > 0) {
      if (inputMode === InputMode.TOKEN) {
        const dollarValue = parseFloat(inputValue) * tokenPrice;
        setEqValue(dollarValue.toFixed(2));
      } else if (inputMode === InputMode.DOLLAR) {
        const tokenAmount = parseFloat(inputValue) / tokenPrice;
        const decimals = token?.decimals || 18;
        const precision = Math.min(decimals, 8);
        setEqValue(tokenAmount.toFixed(precision));
      }
    }
  }, [inputMode, inputValue]);

  const inputPrefix = INPUT_CONFIG[inputMode].prefix;
  const inputPostfix = INPUT_CONFIG[inputMode].postfix;
  const eqPrefix = INPUT_CONFIG[eqMode].prefix;
  const eqPostfix = INPUT_CONFIG[eqMode].postfix;

  return (
    <div className="bg-white px-4 py-3 rounded-md flex flex-row items-center relative">
      <div className="relative flex-1">
        <div className="flex">
          {inputPrefix && <div className={cn('flex-none font-bold', fontSize)}>{inputPrefix}</div>}
          <Input
            value={inputValue}
            onChange={handleChange}
            className={cn('flex-1 border-none', fontSize, 'font-bold pr-24 pl-px')}
            placeholder="0"
            disabled={isDisabled}
            type="text"
            inputMode="decimal"
          />
          {inputPostfix && <div className={cn('flex-none', fontSize)}>{inputPostfix}</div>}
        </div>
        {tokenPrice > 0 && eqValue && !isNaN(Number(eqValue)) && (
          <div>
            {eqPrefix}
            {eqValue}
            {eqPostfix}
          </div>
        )}

        <div
          className={cn(
            'z-10 absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 p-2 rounded-md bg-gray-150 cursor-pointer hover:bg-gray-300',
            (isDisabled || tokenPrice <= 0) && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleToggleMode}
        >
          <ArrowUpDownIcon className="size-4" />
        </div>
      </div>
    </div>
  );
});

AmountInput.displayName = 'AmountInput';

export default AmountInput;
