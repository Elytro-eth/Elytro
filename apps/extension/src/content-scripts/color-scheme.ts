import { RUNTIME_MESSAGE_TYPE } from '@/constants/message';

export enum COLOR_SCHEME {
  DARK = 'dark',
  LIGHT = 'light',
}

function handleChangeColorSchema(
  colorSchema: MediaQueryList | MediaQueryListEvent
) {
  chrome.runtime.sendMessage({
    type: RUNTIME_MESSAGE_TYPE.COLOR_SCHEME_CHANGE,
    scheme: colorSchema.matches ? 'dark' : 'light',
  });
}
export function initDetectColorScheme() {
  const colorSchema = window.matchMedia('(prefers-color-scheme: dark)');
  colorSchema.addEventListener('change', handleChangeColorSchema);
  handleChangeColorSchema(colorSchema);
}

export function getColorScheme() {
  const colorSchema = window.matchMedia('(prefers-color-scheme: dark)');
  return colorSchema.matches ? COLOR_SCHEME.DARK : COLOR_SCHEME.LIGHT;
}
