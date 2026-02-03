import Spin from './spin';
import { cn } from '../utils';

/**
 * LoadingSkeleton - Pre-built loading placeholder layouts
 *
 * Spin Instance Count by Variant:
 * - 'card': 3 spinners per card × count (e.g., count=2 → 6 spinners total)
 * - 'list': 3 spinners per list item × count (1 avatar + 2 text lines)
 * - 'text': 1 spinner per line × count (e.g., count=5 → 5 spinners)
 * - 'custom': 1 spinner (single loading indicator)
 */
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
              <Spin size="sm" color="text-gray-300" isLoading inline />
              <Spin size="sm" color="text-gray-300" isLoading inline />
              <Spin size="sm" color="text-gray-300" isLoading inline />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <Spin size="sm" color="text-gray-300" isLoading inline />
              <div className="flex-1 space-y-2">
                <Spin size="sm" color="text-gray-300" isLoading inline />
                <Spin size="sm" color="text-gray-300" isLoading inline />
              </div>
            </div>
          ))}
        </div>
      );

    case 'text':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-4 w-full flex items-center">
              <Spin size="sm" color="text-gray-300" isLoading inline />
            </div>
          ))}
        </div>
      );

    default:
      return <Spin size="sm" color="text-gray-300" isLoading inline className={className} />;
  }
}
