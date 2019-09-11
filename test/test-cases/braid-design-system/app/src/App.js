import React from 'react';

import 'braid-design-system/reset';
import {
  BraidLoadableProvider,
  Text,
  Checkbox,
  Card,
  IconChevron,
  Box,
} from 'braid-design-system';
import * as style from './App.treat';

const noop = () => {};

export default ({ themeName }) => {
  return (
    <BraidLoadableProvider themeName={themeName}>
      <Text>
        Hello {themeName} <IconChevron />
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
    </BraidLoadableProvider>
  );
};
