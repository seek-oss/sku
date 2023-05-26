import React from 'react';
// @ts-expect-error no types
import { StyleGuideProvider } from 'seek-style-guide/react';
import type { Meta, StoryObj } from 'sku/@storybook/react';

import { TestComponent } from './TestComponent';

const meta = {
  title: 'TestComponent',
  component: TestComponent,
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

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tone: 'caution',
    text: 'Hello world',
  },
};

export const Positive: Story = {
  args: {
    tone: 'positive',
    text: 'Positive text',
  },
};
