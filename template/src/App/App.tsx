import React from 'react';
import 'braid-design-system/reset';
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
