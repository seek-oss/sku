import { Box, Card, Text } from 'braid-design-system';

import * as styles from './TestComponent.css';

interface TestComponentProps {
  tone: React.ComponentProps<typeof Text>['tone'];
  text: string;
}

export const TestComponent = ({ tone, text }: TestComponentProps) => (
  <Card>
    <Text tone={tone} data={{ 'automation-text': true }}>
      {text}
    </Text>
    <Box className={styles.myStyle} data={{ 'automation-vanilla': true }}>
      32px vanilla text
    </Box>
  </Card>
);
