import 'braid-design-system/reset';

import { BraidProvider, Text } from 'braid-design-system';
import apac from 'braid-design-system/themes/apac';

import type { Preview } from 'sku/@storybook/react';

export default {
  decorators: [
    (Story) => (
      <div>
        <Text data={{ 'automation-decorator': true }}>
          Braid Text decorator
        </Text>
        <Story />
      </div>
    ),
    (Story) => (
      <BraidProvider theme={apac}>
        <Story />
      </BraidProvider>
    ),
  ],
} satisfies Preview;
