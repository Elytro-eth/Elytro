import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RUNTIME_MESSAGE_TYPE } from '@/constants/message';

dayjs.extend(relativeTime);

export const bootstrap = (mainFunction: () => void) => {
  const attemptBootstrap = () => {
    chrome.runtime
      .sendMessage({ type: RUNTIME_MESSAGE_TYPE.DOM_READY })
      .then((res) => {
        if (!res) {
          setTimeout(attemptBootstrap, 100);
          return;
        }

        mainFunction();
      });
  };

  attemptBootstrap();
};
