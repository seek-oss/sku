import 'braid-design-system/reset';

import React from 'react';
import { BraidLoadableProvider } from 'braid-design-system';
import NextSteps from './NextSteps';

interface AppProps {
  site: string;
}

export default ({ site }: AppProps) => (
  <BraidLoadableProvider themeName={site}>
    <NextSteps />
  </BraidLoadableProvider>
);
