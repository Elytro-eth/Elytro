import { cn } from '../utils';

export interface RedDotProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'normal' | 'small';
}

export function RedDot(props: RedDotProps) {
  const { className, size = 'normal' } = props;
  const SIZE = {
    normal: 'px-1 py-1',
    small: 'px-0.5 py-0.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-1 py-1 text-xs bg-red font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        SIZE[size],
        className
      )}
    ></div>
  );
}
