// @ts-check
/**
 * This file and all its dependencies must be CJS
 * https://github.com/storybookjs/storybook/pull/23018
 */

/** @typedef {import("@storybook/react-webpack5").StorybookConfig} StorybookConfig */

/** @typedef {import("webpack").Configuration} Configuration */

/**
 * @typedef {object} WebpackOptions
 * @property {'PRODUCTION' | 'DEVELOPMENT' | undefined} [configType]
 */

/**
 * @typedef {function(Configuration, WebpackOptions): Promise<Configuration>} AsyncWebpackFinal
 */

/** @type AsyncWebpackFinal */
const webpackFinal = async (config, { configType }) => {
  const makeStorybookWebpackConfig = (
    await import('./storybookWebpackConfig.js')
  ).default;

  return makeStorybookWebpackConfig(config, {
    // storybook dev -> configType === 'DEVELOPMENT'
    // storybook build -> configType === 'PRODUCTION'
    isDevServer: configType === 'DEVELOPMENT',
  });
};

/** @type {NonNullable<StorybookConfig['babel']>} */
const babel = async () => {
  const createBabelConfig = (await import('../babel/babelConfig.js')).default;

  return createBabelConfig({
    target: 'browser',
    lang: 'ts',
    browserslist: ['chrome > 122'],
    displayNamesProd: true,
  });
};

module.exports = {
  webpackFinal,
  babel,
};
