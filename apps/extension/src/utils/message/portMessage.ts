class PortMessage {
  private _port: chrome.runtime.Port;
  private _listeners: Array<{ type: string; listener: (data: SafeObject) => void }> = [];
  private _isReconnecting = false;

  constructor(private _name: string) {
    this._port = chrome.runtime.connect({ name: this._name });
    this._setupPort();
  }

  private _setupPort() {
    this._port.onDisconnect.addListener(() => {
      console.warn(`[Elytro][PortMessage] Port disconnected, attempting to reconnect...`);
      this._reconnect();
    });
    this._listeners.forEach(({ type, listener }) => {
      this._port.onMessage.addListener(({ type: msgType, data }) => {
        if (msgType === type) {
          listener(data);
        }
      });
    });
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
    this._listeners.push({ type: targetType, listener });
    this._port.onMessage.addListener(({ type, data }) => {
      if (type === targetType) {
        listener(data);
      }
    });
  }
}

export default PortMessage;
