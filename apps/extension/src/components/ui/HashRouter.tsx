import { Router, Route, Switch, Redirect } from 'wouter';
import { useState, useEffect, useCallback } from 'react';
import { TRoute } from '@/types/route';

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

// export const useHashNavigation = () => {
//   const [location, navigate] = useEnhancedHashLocation();

//   return {
//     currentPath: location,
//     navigate,
//     goBack: () => {
//       window.history.back();
//     },
//     goForward: () => window.history.forward(),
//   };
// };

interface HashRouterProps {
  routes: TRoute[];
}

function HashRouter({ routes }: HashRouterProps) {
  return (
    <Router hook={useEnhancedHashLocation}>
      <Switch>
        {routes.map(({ path, component }) => (
          <Route key={path as string} path={path} component={component} />
        ))}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  );
}

export default HashRouter;
