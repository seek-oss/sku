import type { Meta, StoryObj } from '@storybook/react';

import BlueBlock from './BlueBlock';

const meta = {
  title: 'BlueBlock',
  component: BlueBlock,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Border: Story = {
  args: {
    border: true,
  },
};
