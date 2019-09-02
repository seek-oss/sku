import React from 'react';
import { BraidProvider, Alert } from 'braid-design-system';
import { BraidThemeLoader } from './BraidThemeLoader';

interface AppProps {
  site: string;
}

export default ({ site }: AppProps) => (
  <BraidThemeLoader themeName={site}>
    {theme => (
      <BraidProvider theme={theme}>
        <Alert tone="info">Warning: sku awesomeness ensuing</Alert>
      </BraidProvider>
    )}
  </BraidThemeLoader>
);
