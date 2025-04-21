import { checkType } from '../format';
import { localStorage } from '../storage/local';
import { SubscribableStore } from './SubscribableStore';

class LocalSubscribableStore<T extends object> extends SubscribableStore<T> {
  private _localStorageKey: string;
  private _onInitFromLocalStorage?: (state: T) => void;

  constructor(localKey: string, onInitFromLocalStorage?: (state: T) => void) {
    super({} as T);
    this._localStorageKey = localKey;
    this._onInitFromLocalStorage = onInitFromLocalStorage;
    this._initLocalStorage();
  }

  private async _initLocalStorage() {
    this.subscribe((state) => {
      localStorage.save({ [this._localStorageKey]: state });
    });

    const prevState = await localStorage.get(this._localStorageKey);

    if (prevState) {
      this.setState(prevState as T);
    }

    this._onInitFromLocalStorage?.(prevState as T);
  }

  public get state() {
    const createProxy = (obj: T) => {
      return new Proxy(obj, {
        get: (target, prop) => {
          const value = target[prop as keyof T];
          const valueType = checkType(value);

          if (value && ['object', 'array'].includes(valueType)) {
            return createProxy(value as T);
          }
          return value;
        },
        set: (target, prop, value) => {
          if (target[prop as keyof T] !== value) {
            target[prop as keyof T] = value;
            this._notifySubscribers();
          }
          return true;
        },
      });
    };

    return createProxy(this._state);
  }
}

export default LocalSubscribableStore;
