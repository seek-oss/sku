const fs = require('fs');
const path = require('path');
const {
  paths,
  storybookAddons,
  storybookStoryStore,
} = require('../../context');

/** @type {import("@storybook/react-webpack5").StorybookConfig} */
module.exports = {
  stories: paths.src
    .filter((srcPath) => fs.statSync(srcPath).isDirectory())
    .map((srcPath) => path.join(srcPath, '**/*.stories.@(js|ts|tsx)')),
  addons: storybookAddons,
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
  },
  features: {
    storyStoreV7: storybookStoryStore,
  },
  babel: (config) => ({
    ...config,
    presets: [
      ...config.presets,
      [
        require.resolve('@babel/preset-env'),
        {
          targets: {
            chrome: 100,
          },
        },
      ],
      require.resolve('@babel/preset-typescript'),
    ],
  }),
};
