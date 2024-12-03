/**
 * This file and all its dependencies must be CJS
 * https://github.com/storybookjs/storybook/pull/23018
 */

import makeStorybookWebpackConfig from './storybookWebpackConfig.js';
import createBabelConfig from '../babel/babelConfig.js';

/** @typedef {import("@storybook/react-webpack5").StorybookConfig} StorybookConfig */

/** @type {NonNullable<StorybookConfig['webpackFinal']>} */
export const webpackFinal = (config, { configType }) =>
  makeStorybookWebpackConfig(config, {
    // sku storybook -> configType === 'DEVELOPMENT'
    // sku build-storybook -> configType === 'PRODUCTION'
    isDevServer: configType === 'DEVELOPMENT',
  });

/** @type {NonNullable<StorybookConfig['babel']>} */
export const babel = () => {
  return createBabelConfig({
    target: 'browser',
    lang: 'ts',
    browserslist: ['chrome > 122'],
    displayNamesProd: true,
  });
};
