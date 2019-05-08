import React from 'react';
import loadable from '@loadable/component';

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
            id="id_1"
            label="This is a checkbox"
            message={false}
            onChange={noop}
          />
        </Card>
      </ThemeProvider>
    )}
  </Theme>
);
