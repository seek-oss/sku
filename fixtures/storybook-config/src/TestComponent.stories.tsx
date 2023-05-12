import React from 'react';
// @ts-expect-error no types
import { StyleGuideProvider } from 'seek-style-guide/react';
import type { Meta, StoryObj } from 'sku/@storybook/react';

import { TestComponent } from './TestComponent';

export default {
  title: 'TestComponent',
  component: TestComponent,
  argTypes: {
    text: {
      label: 'Text',
      type: { name: 'string', required: true },
    },
  },
  decorators: [
    (Story) => (
      // Storybook doesn't like style guide usage in `preview.tsx` because it tries to import
      // everything and blows up because it doesn't support flow types.
      // This will go away soon when we properly drop support for SSG
      <StyleGuideProvider>
        <Story />
      </StyleGuideProvider>
    ),
  ],
} satisfies Meta;

type Story = StoryObj<typeof TestComponent>;

export const Default: Story = {
  args: {
    tone: 'caution',
    text: 'Hello world',
  },
};

export const Positive: Story = {
  render: () => <TestComponent tone="positive" text="Primary text" />,
};
