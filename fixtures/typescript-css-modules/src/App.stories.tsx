import type { Meta, StoryObj } from 'sku/@storybook/react';
import React from 'react';
import App from './App';

const meta: Meta = {
  title: 'App',
  component: App,
};

export default meta;

type Story = StoryObj<typeof App>;

export const Default: Story = { render: () => <App>Hello World</App> };
