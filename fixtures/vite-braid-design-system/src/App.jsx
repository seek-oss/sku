import 'braid-design-system/reset';
import {
  BraidProvider,
  Text,
  Checkbox,
  Card,
  IconChevron,
  Box,
} from 'braid-design-system';
import theme from 'braid-design-system/themes/apac';
import { useState, useEffect } from 'react';

import { vanillaBox } from './App.css';

const noop = () => {};

function Stuff({ themeName }) {
  const [renderLabel, setRenderLabel] = useState('Initial');

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
      <Box className={vanillaBox}>🧁 Vanilla content {renderLabel}</Box>
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
