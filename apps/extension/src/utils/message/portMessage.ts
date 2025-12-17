type PortMessageListener = {
  type: string;
  listener: (data: SafeObject) => void;
  once: boolean;
};

class PortMessage {
  private _port: chrome.runtime.Port;
  private _listeners: PortMessageListener[] = [];
  private _isReconnecting = false;
  private _handleMessage = ({ type: msgType, data }: { type: string; data: SafeObject }) => {
    if (!msgType) {
      return;
    }

    const listeners = [...this._listeners];
    listeners.forEach((entry) => {
      if (entry.type === msgType) {
        entry.listener(data);
        if (entry.once) {
          this._removeListener(entry);
        }
      }
    });
  };

  constructor(private _name: string) {
    this._port = chrome.runtime.connect({ name: this._name });
    this._setupPort();
  }

  private _setupPort() {
    this._port.onDisconnect.addListener(() => {
      console.warn(`[Elytro][PortMessage] Port disconnected, attempting to reconnect...`);
      this._reconnect();
    });
    this._port.onMessage.addListener(this._handleMessage);
  }

  private _reconnect() {
    if (this._isReconnecting) return;
    this._isReconnecting = true;
    setTimeout(() => {
      try {
        this._port = chrome.runtime.connect({ name: this._name });
        this._setupPort();
        this._isReconnecting = false;
        console.info(`[Elytro][PortMessage] Port reconnected.`);
      } catch (e) {
        console.error(`[Elytro][PortMessage] Reconnect failed, retrying...`, e);
        this._isReconnecting = false;
        this._reconnect();
      }
    }, 1000);
  }

  public sendMessage(type: string, data: SafeObject) {
    try {
      this._port.postMessage({ type, data });
    } catch (e) {
      console.error(`[Elytro][PortMessage] sendMessage error, reconnecting...`, e);
      this._reconnect();
    }
  }

  public onMessage(targetType: string, listener: (data: SafeObject) => void) {
    const entry: PortMessageListener = { type: targetType, listener, once: false };
    this._listeners.push(entry);
    return () => this._removeListener(entry);
  }

  public onMessageOnce(targetType: string, listener: (data: SafeObject) => void) {
    const entry: PortMessageListener = { type: targetType, listener, once: true };
    this._listeners.push(entry);
    return () => this._removeListener(entry);
  }

  private _removeListener(entry: PortMessageListener) {
    const index = this._listeners.indexOf(entry);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
}

export default PortMessage;
