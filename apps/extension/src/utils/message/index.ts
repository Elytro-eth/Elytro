import { RUNTIME_MESSAGE_TYPE } from '@/constants/message';

export { ElytroDuplexMessage, ElytroMessageTypeEn } from './duplexStream';
export { default as RuntimeMessage } from './runtimeMessage';
export { PortMessageManager, type MessageHandler } from './portMessageManager';

export const sendReadyMessageToTabs = async () => {
  const tabs = await chrome.tabs.query({});

  const sendMessage = async (tabId: number) => {
    try {
      await chrome.tabs.sendMessage(tabId, {
        name: RUNTIME_MESSAGE_TYPE.BG_READY,
      });
    } catch (_e) {
      // setTimeout(() => {
      //   sendMessage(tabId);
      // }, 200);
    }
  };

  tabs.forEach((tab) => {
    // todo: && tab.active?
    if (tab.id != null) {
      sendMessage(tab.id);
    }
  });
};
