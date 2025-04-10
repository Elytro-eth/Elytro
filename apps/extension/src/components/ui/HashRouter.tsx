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
