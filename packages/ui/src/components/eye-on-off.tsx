import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface EyeOnOffProps extends React.SVGProps<SVGSVGElement> {
  defaultIsOn?: boolean;
  onChangeVisible?: (isOn: boolean) => void;
  size?: number | string;
}

export function EyeOnOff({ defaultIsOn = false, onChangeVisible, size = 20, ...rest }: EyeOnOffProps) {
  const [isOn, setIsOn] = useState(defaultIsOn);

  const handleChanged = (val: boolean) => {
    setIsOn(val);
    onChangeVisible?.(val);
  };

  return isOn ? (
    <Eye onClick={() => handleChanged(false)} size={size} {...rest} />
  ) : (
    <EyeOff onClick={() => handleChanged(true)} size={size} {...rest} />
  );
}
