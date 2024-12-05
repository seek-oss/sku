/**
 * This file and all its dependencies must be CJS
 * https://github.com/storybookjs/storybook/pull/23018
 */

const getStorybookConfig = async () => {
  const makeStorybookWebpackConfig = (
    await import('./storybookWebpackConfig.js')
  ).default;
  const createBabelConfig = (await import('../babel/babelConfig.js')).default;

  /** @typedef {import("@storybook/react-webpack5").StorybookConfig} StorybookConfig */

  /** @type {NonNullable<StorybookConfig['webpackFinal']>} */
  const webpackFinal = (config, { configType }) =>
    makeStorybookWebpackConfig(config, {
      // sku storybook -> configType === 'DEVELOPMENT'
      // sku build-storybook -> configType === 'PRODUCTION'
      isDevServer: configType === 'DEVELOPMENT',
    });

  /** @type {NonNullable<StorybookConfig['babel']>} */
  const babel = () => {
    return createBabelConfig({
      target: 'browser',
      lang: 'ts',
      browserslist: ['chrome > 122'],
      displayNamesProd: true,
    });
  };

  return {
    webpackFinal,
    babel,
  };
};

module.exports = getStorybookConfig;
