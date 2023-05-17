import 'braid-design-system/reset';

import { BraidProvider, Text } from 'braid-design-system';
import apac from 'braid-design-system/themes/apac';

import React from 'react';
import { DecoratorFn } from 'sku/@storybook/react';

export const decorators: DecoratorFn[] = [
  (Story) => (
    <div>
      <Text data={{ 'automation-decorator': true }}>Braid Text decorator</Text>
      <Story />
    </div>
  ),
  (Story) => (
    <BraidProvider theme={apac}>
      <Story />
    </BraidProvider>
  ),
];
