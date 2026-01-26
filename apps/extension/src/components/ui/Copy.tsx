import { safeClipboard } from '@/utils/clipboard';
import { Copy as IconCopy, Check as IconCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/shadcn/utils';

interface ICopyProps {
  text: string;
  size?: 'sm' | 'xs';
  showToast?: boolean;
  toastTitle?: string;
  iconOnly?: boolean;
}

export default function Copy({
  text,
  size = 'sm',
  showToast = true,
  toastTitle = 'Address copied',
  iconOnly = false,
}: ICopyProps) {
  const [isCopied, setIsCopied] = useState(false);

  const iconSize = size === 'xs' ? 'size-3' : 'size-4';
  const textSize = size === 'xs' ? 'text-xs' : 'text-sm';

  const onCopied = useCallback(
    (copyError?: Error) => {
      if (!copyError) {
        setIsCopied(true);
        if (showToast) {
          toast({
            title: toastTitle,
            variant: 'constructive',
          });
        }
        setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      }
    },
    [showToast, toastTitle]
  );

  const onCopy = useCallback(() => {
    safeClipboard(text, false, onCopied);
  }, [text, onCopied]);

  return isCopied ? (
    <span className={cn('flex items-center gap-1', textSize)}>
      <IconCheck className={cn(iconSize, 'stroke-green-600')} />
      {!iconOnly && 'Copied'}
    </span>
  ) : (
    <IconCopy
      className={cn('elytro-clickable-icon stroke-gray-600 hover:stroke-gray-900 cursor-pointer', iconSize)}
      onClick={onCopy}
    />
  );
}
