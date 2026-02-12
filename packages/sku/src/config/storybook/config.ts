/**
 * This file and all its dependencies must be CJS
 * https://github.com/storybookjs/storybook/pull/23018
 */

import type { Configuration } from 'webpack';
import type { StorybookConfig } from '@storybook/react-webpack5';

import makeStorybookWebpackConfig from './webpackConfig.js';
import createBabelConfig from '../babel.js';

interface WebpackOptions {
  configType?: 'PRODUCTION' | 'DEVELOPMENT' | undefined;
}

type AsyncWebpackFinal = (
  configuration: Configuration,
  webpackOptions: WebpackOptions,
) => Promise<Configuration>;

export const webpackFinal: AsyncWebpackFinal = async (config, { configType }) =>
  makeStorybookWebpackConfig(config, {
    // storybook dev -> configType === 'DEVELOPMENT'
    // storybook build -> configType === 'PRODUCTION'
    isDevServer: configType === 'DEVELOPMENT',
  });

export const babel: NonNullable<StorybookConfig['babel']> = async () =>
  createBabelConfig({
    target: 'browser',
    lang: 'ts',
    browserslist: 'last 2 chrome versions',
    displayNamesProd: true,
  });
