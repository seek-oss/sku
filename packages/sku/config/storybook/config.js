import fs from 'fs';
import path from 'path';
import { paths, storybookAddons, storybookStoryStore } from '../../context';

/** @type {import("@storybook/react-webpack5").StorybookConfig} */
export default {
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
    storyStoryV7: storybookStoryStore,
  },
  babel: (config) => ({
    ...config,
    presets: [
      ...config.presets,
      [
        '@babel/preset-env',
        {
          targets: {
            chrome: 100,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  }),
};
