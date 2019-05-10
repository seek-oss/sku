import React from 'react';
import loadable from 'sku/@loadable/component'; // eslint-disable-line import/no-unresolved

import {
  ThemeProvider,
  Text,
  Checkbox,
  Card,
  ChevronIcon,
} from 'braid-design-system';

const Theme = loadable.lib(props =>
  import(`braid-design-system/themes/${props.themeName}`),
);

const noop = () => {};

export default ({ theme: themeName }) => (
  <Theme themeName={themeName}>
    {({ default: theme }) => (
      <ThemeProvider theme={theme}>
        <Text>
          Hello {themeName} <ChevronIcon inline />
        </Text>
        <Card>
          <Checkbox
            checked={false}
            onChange={noop}
            id="id_1"
            label="This is a checkbox"
            message={false}
          />
        </Card>
      </ThemeProvider>
    )}
  </Theme>
);
