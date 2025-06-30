import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { TestComponent } from './TestComponent';

const meta = {
  title: 'TestComponent',
  component: TestComponent,
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
