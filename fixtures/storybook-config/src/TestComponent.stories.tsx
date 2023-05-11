import React from 'react';
import type { Meta, StoryObj } from 'sku/@storybook/react';

import { StorybookDecorator } from './StorybookDecorator';
import { TestComponent } from './TestComponent';

export default {
  title: 'TestComponent',
  component: TestComponent,
  decorators: [
    (Story) => (
      <StorybookDecorator>
        <Story />
      </StorybookDecorator>
    ),
  ],
  argTypes: {
    text: {
      label: 'Text',
      type: { name: 'string', required: true },
    },
  },
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
