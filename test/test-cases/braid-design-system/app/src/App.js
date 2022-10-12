import 'braid-design-system/reset';
import React, { useState, useEffect } from 'react';
import { Text, Checkbox, Card, IconChevron, Box } from 'braid-design-system';
import { useStyles } from '../../../../../react-treat';

import * as styleRefs from './App.treat';
import { vanillaBox } from './App.css';
import loadable from '../../../../../@loadable';

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

const BraidTheme = loadable.lib((props) =>
  import(`braid-design-system/themes/${props.themeName}`),
);

export default function App({ themeName }) {
  return (
    <BraidTheme themeName={themeName}>
      <Stuff themeName={themeName} />
    </BraidTheme>
  );
}
