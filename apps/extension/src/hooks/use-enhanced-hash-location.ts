import { useCallback, useSyncExternalStore, useEffect } from 'react';

// Track navigation direction globally
let isGoingBack = false;
const historyStack: string[] = [];

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

// Update body class for CSS animations
const updateDirectionClass = (goingBack: boolean) => {
  document.body.classList.remove('nav-forward', 'nav-back');
  document.body.classList.add(goingBack ? 'nav-back' : 'nav-forward');
};

function useEnhancedHashLocation() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Track direction on hash changes
  useEffect(() => {
    const currentHash = window.location.hash.replace(/^#/, '') || '/';

    if (isGoingBack) {
      // Pop from stack when going back
      historyStack.pop();
      isGoingBack = false;
    } else {
      // Push to stack when going forward
      historyStack.push(currentHash);
    }

    updateDirectionClass(isGoingBack);
  }, [hash]);

  // Listen for popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const currentHash = window.location.hash.replace(/^#/, '') || '/';
      // Check if this is a back navigation
      if (historyStack.length > 1 && historyStack[historyStack.length - 2] === currentHash) {
        isGoingBack = true;
        updateDirectionClass(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    isGoingBack = false;
    updateDirectionClass(false);
    window.location.hash = to;
  }, []);

  return [hash, navigate] as [string, (to: string) => void];
}

export default useEnhancedHashLocation;
