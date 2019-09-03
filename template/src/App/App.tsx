import React from 'react';
import { BraidLoadableProvider, Alert } from 'braid-design-system';

interface AppProps {
  site: string;
}

export default ({ site }: AppProps) => (
  <BraidLoadableProvider themeName={site}>
    <Alert tone="info">Warning: sku awesomeness ensuing</Alert>
  </BraidLoadableProvider>
);
