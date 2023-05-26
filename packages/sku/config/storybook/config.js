import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { paths, storybookAddons, storybookStoryStore } from '../../context';

const require = createRequire(import.meta.url);

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
