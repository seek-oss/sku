const storybookWebpackConfig = require('../storybookWebpackConfig');

module.exports = storybookConfig =>
  storybookWebpackConfig(storybookConfig, { isDevServer: true });
