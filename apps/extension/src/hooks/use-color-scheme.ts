import { useSyncExternalStore } from 'react';

export enum COLOR_SCHEME {
  DARK = 'dark',
  LIGHT = 'light',
}

function getSnapshot() {
  const matcher = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return matcher ? COLOR_SCHEME.DARK : COLOR_SCHEME.LIGHT;
}

function subscribe(callback: () => void) {
  const matcher = window.matchMedia('(prefers-color-scheme: dark)');
  matcher.addEventListener('change', callback);
  return () => {
    if (matcher) {
      matcher.removeEventListener('change', callback);
    }
  };
}

export function useColorScheme() {
  const colorscheme = useSyncExternalStore<COLOR_SCHEME>(
    subscribe,
    getSnapshot
  );
  return colorscheme;
}

export const getColorScheme = getSnapshot;
