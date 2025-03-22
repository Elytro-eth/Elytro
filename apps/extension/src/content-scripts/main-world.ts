import { iconElytroDark, iconElytroLight } from '@/assets/icons';
import PageProvider from '@/background/provider/pageProvider';

declare global {
  interface Window {
    elytro: PageProvider;
    ethereum: PageProvider;
  }
}

const generateUUID4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const mainWorld = () => {
  const colorSchema = window?.matchMedia?.('(prefers-color-scheme: dark)');
  const iconElytro = colorSchema?.matches ? iconElytroDark : iconElytroLight;
  const info: EIP6963ProviderInfo = {
    uuid: generateUUID4(),
    name: 'Elytro',
    icon: iconElytro,
    rdns: 'com.elytro',
  };

  if (window.process) {
    //! todo: remove this when not testing with https://metamask.github.io/test-dapp/
    // temp workaround for @metamask/post-message-stream - readable-stream when using https://metamask.github.io/test-dapp/
    window.process.nextTick = (callback, ...args) => {
      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
      }
      Promise.resolve().then(() => callback(...args));
    };
  }

  const injectedProvider = new Proxy(new PageProvider(), {
    deleteProperty: (target, prop) => {
      if (typeof prop === 'string' && ['on'].includes(prop)) {
        // @ts-ignore
        delete target[prop];
      }
      return true;
    },
    get: (target, prop, receiver) => {
      const method = target[prop as keyof PageProvider];
      if (typeof method === 'function') {
        return (...args: SafeAny[]) => {
          // @ts-ignore
          return method.apply(target, args);
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  const announceEvent: EIP6963AnnounceProviderEvent = new CustomEvent(
    'eip6963:announceProvider',
    { detail: Object.freeze({ info, provider: injectedProvider }) }
  );

  const announce = () => {
    window.dispatchEvent(announceEvent);
  };

  window.addEventListener('eip6963:requestProvider', () => {
    announce();
  });

  announce();

  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
  if (!descriptor || descriptor.configurable) {
    try {
      Object.defineProperties(window, {
        elytro: {
          value: injectedProvider,
          configurable: false,
          writable: false,
        },
        ethereum: {
          get() {
            return window.elytro;
          },
          configurable: false,
        },
      });
    } catch (e) {
      console.error(e);
      window.ethereum = injectedProvider;
      window.elytro = injectedProvider;
    }
  } else {
    window.ethereum = injectedProvider;
    window.elytro = injectedProvider;
  }
};

mainWorld();
