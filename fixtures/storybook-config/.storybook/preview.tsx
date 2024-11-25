import 'braid-design-system/reset';

import { BraidProvider, Text } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';

import type { Preview } from '@storybook/react';

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
      <BraidProvider theme={seekJobs}>
        <Story />
      </BraidProvider>
    ),
  ],
} satisfies Preview;
