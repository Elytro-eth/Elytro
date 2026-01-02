import { Suspense } from 'react';
import Spin from '@/components/ui/Spin';
import { Router, Route, Switch, Redirect } from 'wouter';
import { TRoute } from '@/types/route';
import useEnhancedHashLocation from '@/hooks/use-enhanced-hash-location';

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
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <Spin />
          </div>
        }
      >
        <Switch>
          {routes.map(({ path, component }) => (
            <Route key={path as string} path={path} component={component} />
          ))}
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Suspense>
    </Router>
  );
}

export default HashRouter;
