import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { StrictMode, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <BraidProvider theme={seekJobs}>{children}</BraidProvider>
    </StrictMode>
  );
}
