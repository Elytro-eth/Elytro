import { ElytroDuplexMessage, ElytroMessageTypeEn } from '@/utils/message';
import mainWorldScript from './main-world?script&module';
import PortMessage from '@/utils/message/portMessage';
import { RUNTIME_MESSAGE_TYPE } from '@/constants/message';

const portMessage = new PortMessage('elytro-cs');

const dAppMessage = new ElytroDuplexMessage(
  'elytro-content-script',
  'elytro-page-provider'
);

const initDuplexMessageBetweenContentScriptAndPageProvider = () => {
  dAppMessage.connect();

  dAppMessage.listen(async ({ uuid, payload }) => {
    portMessage.sendMessage('CONTENT_SCRIPT_REQUEST', {
      uuid,
      payload,
    });
  });
};

initDuplexMessageBetweenContentScriptAndPageProvider();

const initRuntimeMessage = () => {
  portMessage.sendMessage('NEW_PAGE_LOADED', {});

  portMessage.onMessage(ElytroMessageTypeEn.MESSAGE, (data) => {
    dAppMessage.send({
      type: ElytroMessageTypeEn.MESSAGE,
      payload: data as ElytroEventMessage,
    });
  });

  portMessage.onMessage(
    ElytroMessageTypeEn.RESPONSE_TO_CONTENT_SCRIPT,
    (data) => {
      dAppMessage.send({
        type: ElytroMessageTypeEn.RESPONSE_TO_PAGE_PROVIDER,
        uuid: data.uuid,
        payload: {
          method: data.method,
          response: data.response,
        },
      });
    }
  );
};

initRuntimeMessage();

const injectMainWorldScript = () => {
  if (
    !document.querySelector(
      `script[src="${chrome.runtime.getURL(mainWorldScript)}"]`
    )
  ) {
    const script = Object.assign(document.createElement('script'), {
      src: chrome.runtime.getURL(mainWorldScript),
      type: 'module',
    });
    document.head.prepend(script);
    document.head.removeChild(script);
  }
};

injectMainWorldScript();

function changeColorSchema(colorSchema: MediaQueryList | MediaQueryListEvent) {
  chrome.runtime.sendMessage({
    type: RUNTIME_MESSAGE_TYPE.COLOR_SCHEME_CHANGE,
    scheme: colorSchema.matches ? 'dark' : 'light',
  });
}
const colorSchema = window.matchMedia('(prefers-color-scheme: dark)');
colorSchema.addEventListener('change', changeColorSchema);
changeColorSchema(colorSchema);
