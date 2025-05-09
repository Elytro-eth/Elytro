import { safeClipboard } from '@/utils/clipboard';
import { Copy as IconCopy, Check as IconCheck } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ICopyProps {
  text: string;
}

export default function Copy({ text }: ICopyProps) {
  const [isCopied, setIsCopied] = useState(false);
  const onCopied = useCallback((copyError?: Error) => {
    if (!copyError) {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    }
  }, []);

  const onCopy = useCallback(() => {
    safeClipboard(text, false, onCopied);
  }, [text]);

  return isCopied ? (
    <div className="flex items-center gap-2">
      <IconCheck className="elytro-icon size-4 stroke-green" />
      <span className="text-green-600">Address copied</span>
    </div>
  ) : (
    <IconCopy
      className="elytro-clickable-icon size-4 stroke-gray-600 hover:stroke-gray-900"
      onClick={onCopy}
    />
  );
}
