import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { StrictMode } from 'react';
import { Outlet } from 'react-router';

/**
 * Your app's root layout route. Mount isomorphic providers here (Braid, Vocab,
 * Apollo via `useReactContext()`, …). Env-differing *values* come from dual-entry
 * `getReactContext`; serialisable content from `getClientContext` / `useClientContext`.
 *
 * Providers that `<head>` nodes need must wrap `<html>`. Braid stays inside `<body>`.
 */
export const RootLayout = () => (
  <StrictMode>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <BraidProvider theme={seekJobs}>
          <Outlet />
        </BraidProvider>
      </body>
    </html>
  </StrictMode>
);
