import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { StrictMode } from 'react';
import { Outlet } from 'react-router';

/**
 * Your app's root layout route. Mount isomorphic providers here (Braid, Vocab,
 * Apollo via `useReactContext()`, …). Env-differing *values* come from dual-entry
 * `getReactContext`; serialisable content from `getClientContext` / `useClientContext`.
 */
export const RootLayout = () => (
  <StrictMode>
    <BraidProvider theme={seekJobs}>
      <Outlet />
    </BraidProvider>
  </StrictMode>
);
