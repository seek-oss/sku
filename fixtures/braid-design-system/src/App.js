import 'braid-design-system/reset';
import React, { useState, useEffect } from 'react';
import {
  BraidProvider,
  Text,
  Checkbox,
  Card,
  IconChevron,
  Box,
} from 'braid-design-system';
import theme from 'braid-design-system/themes/apac';
import { useStyles } from 'sku/react-treat';

import * as styleRefs from './App.treat';
import { vanillaBox } from './App.css';

const noop = () => {};

function Stuff({ themeName }) {
  const [renderLabel, setRenderLabel] = useState('Initial');
  const styles = useStyles(styleRefs);

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <>
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
      <Box className={styles.customBox}>Custom content {renderLabel}</Box>
      <Box className={vanillaBox}>🧁 Vanilla content</Box>
    </>
  );
}

export default function App({ themeName }) {
  return (
    <BraidProvider theme={theme}>
      <Stuff themeName={themeName} />
    </BraidProvider>
  );
}