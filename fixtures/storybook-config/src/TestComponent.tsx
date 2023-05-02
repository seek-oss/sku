import { Card, Text } from 'braid-design-system';
import React from 'react';

type TestComponentProps = {
  tone: React.ComponentProps<typeof Text>['tone'];
  children: React.ReactNode;
};

export const TestComponent = ({ children, tone }: TestComponentProps) => (
  <Card>
    <Text tone={tone} data={{ 'automation-text': true }}>
      {children}
    </Text>
  </Card>
);
