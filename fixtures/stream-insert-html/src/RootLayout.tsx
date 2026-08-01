import { Outlet, Link } from 'react-router';

import { ApolloProvider } from './ApolloProvider.js';
import { useReactContext } from './ssrContext.js';

/**
 * Pathless root layout: isomorphic Apollo provider mounts here and reads
 * env-differing values from dual-entry `getReactContext`.
 */
export const RootLayout = () => {
  const reactContext = useReactContext();

  return (
    <ApolloProvider
      makeClient={reactContext.makeClient}
      extraScriptProps={
        'extraScriptProps' in reactContext
          ? reactContext.extraScriptProps
          : undefined
      }
    >
      <div>
        <nav>
          <Link to="/" data-testid="nav-products">
            Products
          </Link>{' '}
          <Link to="/reviews" data-testid="nav-reviews">
            Reviews
          </Link>
        </nav>
        <Outlet />
      </div>
    </ApolloProvider>
  );
};
