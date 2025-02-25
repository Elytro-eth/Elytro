type MessageListener = (
  message: SafeObject,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: SafeAny) => void
) => void;

class RuntimeMessage {
  static sendMessage(
    type: string,
    params?: SafeObject,
    onResponse?: (response: SafeAny) => void
  ): Promise<SafeAny> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type,
          ...params,
        },
        (response) => {
          // if (chrome.runtime.lastError) {
          //   // reject(chrome.runtime.lastError);
          //   // console.error(
          //   //   'Elytro: Runtime message error',
          //   //   chrome.runtime.lastError
          //   // );
          // } else {
          //   onResponse?.(response);
          //   resolve(response);
          // }
          if (!chrome.runtime.lastError) {
            onResponse?.(response);
            resolve(response);
          }
        }
      );
    });
  }

  static onMessage(type: string, callback: MessageListener) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message.type) {
        console.error("Elytro: Received message without 'type' property.");
        return false;
      }
      if (message.type === type) {
        callback(message, sender, sendResponse);
      }
      return true;
    });
  }

  static offMessage(listener: MessageListener) {
    chrome.runtime.onMessage.removeListener(listener);
  }
}

export default RuntimeMessage;
