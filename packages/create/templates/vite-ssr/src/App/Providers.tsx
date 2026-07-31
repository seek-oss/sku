import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { StrictMode } from 'react';
import type { SkuSsrProviders } from 'sku';

/**
 * Rendered outside the router, so React Router hooks are unavailable here and
 * providers must stay context-only. Wrapping that needs the router (or loader
 * data) belongs in the root layout route in `src/routes.tsx`.
 */
export const Providers: SkuSsrProviders = ({ children }) => (
  <StrictMode>
    <BraidProvider theme={seekJobs}>{children}</BraidProvider>
  </StrictMode>
);
