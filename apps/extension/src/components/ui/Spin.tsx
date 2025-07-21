import { Skeleton } from './skeleton';

interface ISpinProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  isLoading?: boolean;
  showSkeleton?: boolean;
}

export default function Spin({
  size = 'md',
  color = 'text-blue-600',
  isLoading = false,
  showSkeleton = false,
}: ISpinProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-5',
  };

  if (!isLoading) return null;

  if (showSkeleton) {
    return <Skeleton className={sizeClasses[size]} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
      <div className="inline-block">
        <div
          className={`${sizeClasses[size]} ${color} animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
}
