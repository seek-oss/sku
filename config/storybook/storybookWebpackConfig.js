const webpack = require('webpack');
const { paths } = require('../../context');
const find = require('lodash/find');
const { merge: webpackMerge } = require('webpack-merge');
const isCI = require('../../lib/isCI');
const makeWebpackConfig = require('../webpack/webpack.config');
const { resolvePackage } = require('../webpack/utils/resolvePackage');

const hot = process.env.SKU_HOT !== 'false';

module.exports = ({ config }, { isDevServer }) => {
  if (isCI) {
    // Remove noisy progress plugin in CI, currently no official option to disable
    // https://github.com/storybookjs/storybook/issues/1260#issuecomment-308036626
    config.plugins = config.plugins.filter(
      (plugin) => !(plugin instanceof webpack.ProgressPlugin),
    );
  }

  const clientWebpackConfig = find(
    makeWebpackConfig({
      isIntegration: true,
      isDevServer,
      hot: isDevServer && hot,
    }),
    ({ name }) => name === 'client',
  );

  // Ensure Storybook's webpack loaders ignore our code :(
  if (config && config.module && Array.isArray(config.module.rules)) {
    config.module.rules.forEach((rule) => {
      const previousExclude = rule.exclude || [];
      rule.exclude = [
        ...(Array.isArray(previousExclude)
          ? previousExclude
          : [previousExclude]), // Ensure we don't clobber any existing exclusions
        ...paths.src,
        ...paths.compilePackages.map(resolvePackage),
        /\.vanilla\.css$/,
      ];
    });
  }

  return webpackMerge(config, {
    // We don't want to apply the entire webpack config,
    // mainly because it configures entries and outputs,
    // which would break the Storybook build.
    module: clientWebpackConfig.module,
    resolve: clientWebpackConfig.resolve,
    plugins: clientWebpackConfig.plugins,
    stats: 'errors-only',
  });
};
