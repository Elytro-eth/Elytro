import { useCallback, useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
    window.removeEventListener('popstate', callback);
  };
};

const getSnapshot = () => {
  return window.location.hash.replace(/^#/, '') || '/';
};

const getServerSnapshot = () => '/';

function useEnhancedHashLocation() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [hash, navigate] as [string, (to: string) => void];
}

export default useEnhancedHashLocation;
