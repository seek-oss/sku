const webpack = require('webpack');
const { paths } = require('../../context');
const find = require('lodash/find');
const webpackMerge = require('webpack-merge');
const makeWebpackConfig = require('../webpack/webpack.config');
const { resolvePackage } = require('../webpack/utils/resolvePackage');

module.exports = ({ config }, { isDevServer }) => {
  const clientWebpackConfig = find(
    makeWebpackConfig({ isIntegration: true, isDevServer }),
    ({ name }) => name === 'client',
  );

  // Ensure Storybook's webpack loaders ignore our code :(
  if (config && config.module && Array.isArray(config.module.rules)) {
    config.module.rules.forEach(rule => {
      rule.exclude = [
        ...(rule.exclude || []), // Ensure we don't clobber any existing exclusions
        ...paths.src,
        ...paths.compilePackages.map(resolvePackage),
      ];
    });
  }

  return webpackMerge(
    config,
    {
      // We don't want to apply the entire webpack config,
      // mainly because it configures entries and outputs,
      // which would break the Storybook build.
      module: clientWebpackConfig.module,
      resolve: clientWebpackConfig.resolve,
      plugins: clientWebpackConfig.plugins,
    },
    {
      plugins: [
        new webpack.DefinePlugin({
          // Webpack has to have access to these paths statically
          // at build time, so we need to manually pass each value
          // one by one. If we don't have a srcPath, we fall back
          // to the current directory, which is effectively a no-op
          // since it doesn't contain any files ending in '.stories.js'.
          // We're providing up to 10 source paths for now, which is
          // totally arbitrary, but designed to be more than we'd need.
          // The first path doesn't fall back to __dirname because they
          // need to provide at least one valid srcPath.
          __SKU_SRC_PATHS_0__: JSON.stringify(paths.src[0]),
          __SKU_SRC_PATHS_1__: JSON.stringify(paths.src[1] || __dirname),
          __SKU_SRC_PATHS_2__: JSON.stringify(paths.src[2] || __dirname),
          __SKU_SRC_PATHS_3__: JSON.stringify(paths.src[3] || __dirname),
          __SKU_SRC_PATHS_4__: JSON.stringify(paths.src[4] || __dirname),
          __SKU_SRC_PATHS_5__: JSON.stringify(paths.src[5] || __dirname),
          __SKU_SRC_PATHS_6__: JSON.stringify(paths.src[6] || __dirname),
          __SKU_SRC_PATHS_7__: JSON.stringify(paths.src[7] || __dirname),
          __SKU_SRC_PATHS_8__: JSON.stringify(paths.src[8] || __dirname),
          __SKU_SRC_PATHS_9__: JSON.stringify(paths.src[9] || __dirname),
        }),
      ],
    },
  );
};
