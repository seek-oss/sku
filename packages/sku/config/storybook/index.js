/**
 * This file and all its dependencies must be CJS
 * https://github.com/storybookjs/storybook/pull/23018
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  paths,
  storybookAddons,
  storybookStoryStore,
} = require('../../context');

const makeStorybookWebpackConfig = require('./storybookWebpackConfig');

/** @type {import("@storybook/react-webpack5").StorybookConfig} */
module.exports = {
  stories: paths.src
    .filter((srcPath) => fs.statSync(srcPath).isDirectory())
    .map((srcPath) => path.join(srcPath, '**/*.stories.@(js|ts|tsx)')),
  addons: storybookAddons,
  framework: {
    // Storybook looks for a `/preset` entrypoint on the framework package,
    // so we give it the dirname of the resolved path to package.json
    // https://github.com/storybookjs/storybook/blob/aecfa1791f982bef6a06b51d20df3e31dd82b5b4/code/lib/core-common/src/utils/validate-config.ts#L34
    name: path.dirname(
      require.resolve('@storybook/react-webpack5/package.json'),
    ),
    options: {},
  },
  core: {
    builder: {
      name: require.resolve('@storybook/builder-webpack5'),
      options: {
        fsCache: true,
      },
    },
    disableTelemetry: true,
  },
  features: {
    storyStoreV7: storybookStoryStore,
  },
  // sku storybook -> configType === 'DEVELOPMENT'
  // sku build-storybook -> configType === 'PRODUCTION'
  webpackFinal: (config, { configType }) =>
    makeStorybookWebpackConfig(config, {
      isDevServer: configType === 'DEVELOPMENT',
    }),
  babel: (config) => ({
    ...config,
    presets: [
      // Includes `@babel/preset-react`
      ...config.presets,

      // Storybook as of 7.0 no longer handles babel stuff for you (other than react)
      // We need to configure TypeScript support ourselves, if we want it
      // https://github.com/storybookjs/storybook/issues/22357#issuecomment-1532548058
      [
        require.resolve('@babel/preset-env'),
        {
          targets: {
            chrome: 100,
          },
        },
      ],
      [
        require.resolve('@babel/preset-typescript'),
        {
          allExtensions: true,
          isTSX: true,
        },
      ],
    ],
  }),
};
