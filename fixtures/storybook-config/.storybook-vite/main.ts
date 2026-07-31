import type { StorybookConfig } from '@storybook/react-vite';
import { viteFinal } from 'sku/config/storybook';

export default {
  stories: ['../src/**/*.stories.tsx', '../src/**/*.mdx'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  addons: ['@storybook/addon-docs'],
  viteFinal,
} satisfies StorybookConfig;
