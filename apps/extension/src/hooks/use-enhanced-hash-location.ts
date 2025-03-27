import { useState, useEffect, useCallback } from 'react';

function useEnhancedHashLocation() {
  const getHash = () => window.location.hash.replace(/^#/, '') || '/';

  const [hash, setHash] = useState(getHash());

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = getHash();
      if (newHash !== hash) {
        setHash(newHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [hash]);

  return [hash, navigate] as [string, (to: string) => void];
}

export default useEnhancedHashLocation;
