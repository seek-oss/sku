import React from 'react';
import { seekAnz } from 'braid-design-system/lib/themes';
import { ThemeProvider, Text } from 'braid-design-system';

export default () => (
  <ThemeProvider theme={seekAnz}>
    <Text>Hello World</Text>
  </ThemeProvider>
);
