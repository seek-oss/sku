import React from 'react';
import loadable from 'sku/@loadable/component'; // eslint-disable-line import/no-unresolved

import {
  BraidProvider,
  Text,
  Checkbox,
  Card,
  ChevronIcon,
  Box,
} from 'braid-design-system';
import * as style from './App.treat';

const Theme = loadable.lib(props =>
  import(`braid-design-system/themes/${props.themeName}`),
);

const noop = () => {};

export default ({ theme: themeName }) => {
  return (
    <Theme themeName={themeName}>
      {({ default: theme }) => (
        <BraidProvider theme={theme}>
          <Text>
            Hello {themeName} <ChevronIcon inline />
          </Text>
          <Card>
            <Checkbox
              checked={false}
              onChange={noop}
              id="id_1"
              label="This is a checkbox"
            />
          </Card>
          <Box className={style.customBox}>Custom content</Box>
        </BraidProvider>
      )}
    </Theme>
  );
};
