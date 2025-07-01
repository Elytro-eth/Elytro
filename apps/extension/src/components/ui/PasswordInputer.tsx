import { EyeOnOff } from '@/components/ui/EyeOnOff';
import { Input, InputProps } from './input';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useState } from 'react';
import { cn } from '@/utils/shadcn/utils';

interface PasswordInputProps<T extends FieldValues> extends InputProps {
  field?: ControllerRenderProps<T>;
  showEye?: boolean;
  onValueChange?: (value: string) => void;
  outerPwdVisible?: boolean;
  onPwdVisibleChange?: (visible: boolean) => void;
}

export default function PasswordInput<T extends FieldValues>({
  disabled,
  field,
  showEye = true,
  className,
  onValueChange,
  outerPwdVisible,
  onPwdVisibleChange,
  ...rest
}: PasswordInputProps<T>) {
  const [innerPwdVisible, setInnerPwdVisible] = useState(false);

  const handlePwdVisibleChange = (visible: boolean) => {
    setInnerPwdVisible(visible);
    onPwdVisibleChange?.(visible);
  };

  return (
    <div className="relative w-full">
      <Input
        disabled={disabled}
        type={outerPwdVisible || innerPwdVisible ? 'text' : 'password'}
        className={cn('bg-gray-150 border-none rounded-2xl p-4 h-14', className)}
        onChange={(e) => {
          onValueChange?.(e.target.value);
        }}
        {...field}
        {...rest}
      />
      {showEye && (
        <EyeOnOff className="absolute top-1/4 right-4 cursor-pointer" onChangeVisible={handlePwdVisibleChange} />
      )}
    </div>
  );
}
