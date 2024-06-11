import type { StorybookConfig } from '@storybook/react-webpack5';
import { babel, webpackFinal } from 'sku/config/storybook';

export default {
  stories: ['../src/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  core: {
    builder: {
      name: '@storybook/builder-webpack5',
      options: {
        fsCache: true,
      },
    },
    disableTelemetry: true,
  },
  addons: ['@storybook/addon-webpack5-compiler-babel'],
  babel,
  webpackFinal,
} satisfies StorybookConfig;
