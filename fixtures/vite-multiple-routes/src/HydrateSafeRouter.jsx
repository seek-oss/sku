import { useLayoutEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';

export const HydrateSafeRouter = ({ children, initialRoute }) => {
  const [okayToUseBrowser, setOkayToUseBrowser] = useState(() => {
    if (typeof window === 'undefined') {
      throw new Error(
        `HydrateRouter should not be called by server rendered code.`,
      );
    }
    const currentLocation = window.location.pathname;
    const differentLocationToRendered = currentLocation !== initialRoute;

    if (differentLocationToRendered) {
      // eslint-disable-next-line no-console
      console.warn(
        `Browser location differs from rendered location. This could be due to a :param in your static route, or edge routing returning the wrong document. \nThis will cause two renders to occur and may hurt initial page performance. Initially rendered on ${initialRoute} but location is currently ${currentLocation}`,
      );
    }
    return !differentLocationToRendered;
  });
  useLayoutEffect(() => {
    if (!okayToUseBrowser) {
      setOkayToUseBrowser(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (okayToUseBrowser) {
    return (
      <BrowserRouter future={{ v7_startTransition: true }}>
        {children}
      </BrowserRouter>
    );
  }
  return <StaticRouter location={initialRoute}>{children}</StaticRouter>;
};
