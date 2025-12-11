import { Skeleton } from './skeleton';
import { cn } from '@/utils/shadcn/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'text' | 'custom';
  count?: number;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className, children }: LoadingSkeletonProps) {
  if (children) {
    return <div className={cn('animate-pulse', className)}>{children}</div>;
  }

  switch (variant) {
    case 'card':
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-md">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'text':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );

    default:
      return <Skeleton className={className} />;
  }
}
