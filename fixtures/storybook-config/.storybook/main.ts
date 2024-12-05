import type { StorybookConfig } from '@storybook/react-webpack5';
import getStorybookConfig from 'sku/config/storybook';

export default {
  stories: ['../src/**/*.stories.tsx', '../src/**/*.mdx'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        fsCache: true,
      },
    },
  },
  core: {
    disableTelemetry: true,
  },
  addons: ['@storybook/addon-webpack5-compiler-babel', '@storybook/addon-docs'],
  babel: async (options: any) => {
    const { babel } = await getStorybookConfig();

    return babel(options);
  },
  webpackFinal: async (...args) => {
    const { webpackFinal } = await getStorybookConfig();

    return webpackFinal(...args);
  },
} satisfies StorybookConfig;
