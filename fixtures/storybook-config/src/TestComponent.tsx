import { Box, Card, Text } from 'braid-design-system';
import React from 'react';
// @ts-expect-error no types
import { Text as SSGText, HeartIcon } from 'seek-style-guide/react';

import * as styles from './TestComponent.css';
import stylesRefs from './TestComponent.less';

type TestComponentProps = {
  tone: React.ComponentProps<typeof Text>['tone'];
  text: string;
};

export const TestComponent = ({ tone, text }: TestComponentProps) => (
  <Card>
    <Text tone={tone} data={{ 'automation-text': true }}>
      {text}
    </Text>
    <Box className={styles.myStyle} data={{ 'automation-vanilla': true }}>
      32px vanilla text
    </Box>
    <Box className={stylesRefs.root} data={{ 'automation-less': true }}>
      32px less text
    </Box>
    <SSGText large data-automation-seek-style-guide>
      Style guide text
    </SSGText>
    <HeartIcon data-automation-svg />
  </Card>
);
