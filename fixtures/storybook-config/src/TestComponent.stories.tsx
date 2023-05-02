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
} satisfies Meta;

type Story = StoryObj<typeof TestComponent>;

export const Default: Story = {
  render: () => <TestComponent tone="caution">Hello world</TestComponent>,
};
