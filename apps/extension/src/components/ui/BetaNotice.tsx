import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAsyncEffect } from 'ahooks';
import { localStorage } from '@/utils/storage/local';

interface IBetaNoticeProps {
  text: string;
  closeable?: boolean;
  onClose?: () => void;
}

const BETA_NOTICE_STORAGE_KEY = 'beta_notice_storage_key';
const DAYS = 24 * 60 * 60 * 1000;

export default function BetaNotice(props: IBetaNoticeProps) {
  const [isShow, setIsShow] = useState(false);

  useAsyncEffect(async () => {
    const lastCloseTimestamp =
      (await localStorage.get<number>(BETA_NOTICE_STORAGE_KEY)) || 0;
    if (
      !lastCloseTimestamp ||
      Date.now() - (lastCloseTimestamp as number) > 30 * DAYS
    ) {
      setIsShow(true);
    }
  }, []);

  const onClose = useCallback(() => {
    localStorage.save({
      [BETA_NOTICE_STORAGE_KEY]: Date.now(),
    });
    setIsShow(false);
    props?.onClose?.();
  }, []);

  if (!isShow) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 p-2 flex"
      style={{
        background:
          'radial-gradient(100% 336.18% at 0% 0%, #F1E8DF 0%, #F7F7F0 25.15%, #DAECEE 100%)',
      }}
    >
      <div>{props.text}</div>
      {props.closeable && (
        <X
          className="elytro-clickable-icon absolute right-2"
          onClick={onClose}
        />
      )}
    </div>
  );
}
