import type { StorybookConfig } from '@storybook/react-webpack5';

// export const webpackFinal: NonNullable<StorybookConfig['webpackFinal']>;
// export const babel: NonNullable<StorybookConfig['babel']>;

export default async () => ({
  webpackFinal: NonNullable<StorybookConfig['webpackFinal']>,
  babel: NonNullable<StorybookConfig['babel']>,
});
