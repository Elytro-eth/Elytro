import Spin from './Spin';
import { cn } from '@/utils/shadcn/utils';

/**
 * LoadingSkeleton - Pre-built loading placeholder layouts
 *
 * Spin Instance Count by Variant:
 * - 'card': 3 spinners per card × count (e.g., count=2 → 6 spinners total)
 * - 'list': 3 spinners per list item × count (1 avatar + 2 text lines)
 * - 'text': 1 spinner per line × count (e.g., count=5 → 5 spinners)
 * - 'custom': 1 spinner (single loading indicator)
 *
 * Example: <LoadingSkeleton variant="card" count={2} /> → 6 Spin instances (2 cards × 3 spinners each)
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
      // Creates card-shaped loading placeholders
      // Each card contains 3 spinners representing typical card content (title, subtitle, description)
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-md">
              {/* Spinner 1: Represents card title/heading */}
              <Spin size="sm" color="text-gray-300" isLoading inline />
              {/* Spinner 2: Represents card subtitle/metadata */}
              <Spin size="sm" color="text-gray-300" isLoading inline />
              {/* Spinner 3: Represents card body/description */}
              <Spin size="sm" color="text-gray-300" isLoading inline />
            </div>
          ))}
        </div>
      );

    case 'list':
      // Creates list-item loading placeholders
      // Each list item contains 3 spinners: 1 avatar + 2 text lines
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              {/* Spinner 1: Represents avatar/icon on the left */}
              <Spin size="sm" color="text-gray-300" isLoading inline />
              <div className="flex-1 space-y-2">
                {/* Spinner 2: Represents primary text/title */}
                <Spin size="sm" color="text-gray-300" isLoading inline />
                {/* Spinner 3: Represents secondary text/subtitle */}
                <Spin size="sm" color="text-gray-300" isLoading inline />
              </div>
            </div>
          ))}
        </div>
      );

    case 'text':
      // Shows one spinner per line of text
      // count parameter determines the number of text lines (e.g., count=3 → 3 lines with 3 spinners)
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-4 w-full flex items-center">
              {/* One spinner per text line - indicates that line is loading */}
              <Spin size="sm" color="text-gray-300" isLoading inline />
            </div>
          ))}
        </div>
      );

    default:
      // Single spinner for general/custom loading use
      // Used when you just need one simple loading indicator
      return <Spin size="sm" color="text-gray-300" isLoading inline className={className} />;
  }
}
