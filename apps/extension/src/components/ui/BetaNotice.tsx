import { X } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';
import { localStorage } from '@/utils/storage/local';

interface IBetaNoticeProps {
  text: string;
  closeable?: boolean;
  onClose?: () => void;
}

const BETA_NOTICE_STORAGE_KEY = 'beta_notice_storage_key';
const DAYS = 24 * 60 * 60 * 1000;

export default function BetaNotice({ text, closeable, onClose }: IBetaNoticeProps) {
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    const checkNoticeVisibility = async () => {
      const lastCloseTimestamp = (await localStorage.get<number>(BETA_NOTICE_STORAGE_KEY)) || 0;

      if (!lastCloseTimestamp || Date.now() - (lastCloseTimestamp as number) > 30 * DAYS) {
        setIsShow(true);
      }
    };

    checkNoticeVisibility();
  }, []);

  const handleClose = useCallback(() => {
    localStorage.save({
      [BETA_NOTICE_STORAGE_KEY]: Date.now(),
    });
    setIsShow(false);
    onClose?.();
  }, [onClose]);

  if (!isShow) {
    return null;
  }

  return (
    <div className="h-9 p-2 flex bg-green-200">
      <div>{text}</div>
      {closeable && <X className="elytro-clickable-icon absolute right-2" onClick={handleClose} />}
    </div>
  );
}
