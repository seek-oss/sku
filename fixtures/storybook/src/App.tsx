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
import apac from 'braid-design-system/themes/apac';

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
    <BraidProvider theme={apac}>
      <Stuff themeName={themeName} />
    </BraidProvider>
  );
}
