import React, { Component } from 'react';
import loadable from 'sku/@loadable/component';

import { BraidProvider, Alert } from 'braid-design-system';

const Theme = loadable.lib(props =>
  import(`braid-design-system/themes/${props.braidTheme}`),
);

export default ({ site }) => (
  <Theme braidTheme={site}>
    {({ default: theme }) => (
      <BraidProvider theme={theme}>
        <Alert tone="critical">Warning: sku awesomeness ensuing</Alert>
      </BraidProvider>
    )}
  </Theme>
);
