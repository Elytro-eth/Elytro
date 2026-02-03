import { cn } from '../utils';

interface ISpinProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  isLoading?: boolean;
  inline?: boolean;
  className?: string;
}

export default function Spin({
  size = 'md',
  color = 'text-blue-600',
  isLoading = false,
  inline = false,
  className,
}: ISpinProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 border-1',
    md: 'w-12 h-12 border-2',
    lg: 'w-20 h-20 border-4',
  };

  if (!isLoading) return null;

  const spinner = (
    <div className={cn('relative inline-flex items-center justify-center', className)} aria-hidden="true">
      {/* Background ring */}
      <div className={cn(`${sizeClasses[size]} rounded-full border-solid border-green-300 absolute`)} />
      {/* Animated ring */}
      <div
        className={cn(
          `${sizeClasses[size]} ${color} animate-spin rounded-full border-solid border-green-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`
        )}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );

  if (inline) {
    return spinner;
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 backdrop-blur-sm z-50"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="inline-block">{spinner}</div>
    </div>
  );
}
