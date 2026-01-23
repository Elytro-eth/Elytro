import { EyeOnOff } from '@/components/ui/EyeOnOff';
import { Input, InputProps } from './input';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useState } from 'react';

interface PasswordInputProps<T extends FieldValues> extends Omit<InputProps, 'rightIcon' | 'type'> {
  field?: ControllerRenderProps<T>;
  showEye?: boolean;
  onValueChange?: (value: string) => void;
  outerPwdVisible?: boolean;
  onPwdVisibleChange?: (visible: boolean) => void;
  iconSize?: number;
}

export default function PasswordInput<T extends FieldValues>({
  disabled,
  field,
  showEye = true,
  className,
  onValueChange,
  outerPwdVisible,
  onPwdVisibleChange,
  variant = 'default',
  iconSize = 20,
  ...rest
}: PasswordInputProps<T>) {
  const [innerPwdVisible, setInnerPwdVisible] = useState(false);

  const handlePwdVisibleChange = (visible: boolean) => {
    setInnerPwdVisible(visible);
    onPwdVisibleChange?.(visible);
  };

  return (
    <Input
      disabled={disabled}
      type={outerPwdVisible || innerPwdVisible ? 'text' : 'password'}
      variant={variant}
      className={className}
      onChange={(e) => {
        onValueChange?.(e.target.value);
      }}
      rightIcon={showEye ? <EyeOnOff size={iconSize} onChangeVisible={handlePwdVisibleChange} /> : undefined}
      {...field}
      {...rest}
    />
  );
}
