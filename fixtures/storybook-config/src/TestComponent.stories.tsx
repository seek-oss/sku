import type { Meta, StoryObj } from 'sku/@storybook/react';
import React from 'react';
import { TestComponent } from './TestComponent';
import { StorybookDecorator } from './StorybookDecorator';

const meta: Meta = {
  title: 'TestComponent',
  component: TestComponent,
  decorators: [
    (Story) => (
      <StorybookDecorator>
        <Story />
      </StorybookDecorator>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TestComponent>;

export const Default: Story = {
  render: () => <TestComponent tone="caution">Hello world</TestComponent>,
};
