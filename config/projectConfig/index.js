const fs = require('fs');
const { merge } = require('lodash');

const { getPathFromCwd } = require('../../lib/cwd');
const args = require('../args');
const defaultSkuConfig = require('./defaultSkuConfig');

const appSkuConfigPath = getPathFromCwd(args.config);

const appSkuConfig = fs.existsSync(appSkuConfigPath)
  ? require(appSkuConfigPath)
  : {};
const skuConfig = merge(defaultSkuConfig, appSkuConfig);

const env = {
  ...skuConfig.env,
  SKU_TENANT: args.tenant
};

const paths = {
  src: skuConfig.srcPaths.map(getPathFromCwd),
  compilePackages: [
    'seek-style-guide',
    'seek-asia-style-guide',
    'braid-design-system',
    ...skuConfig.compilePackages
  ],
  clientEntry: getPathFromCwd(skuConfig.entry.client),
  renderEntry: getPathFromCwd(skuConfig.entry.render),
  serverEntry: getPathFromCwd(skuConfig.entry.server),
  public: getPathFromCwd(skuConfig.public),
  target: getPathFromCwd(skuConfig.target),
  publicPath: skuConfig.publicPath
};

module.exports = {
  paths,
  env,
  locales: skuConfig.locales,
  hosts: skuConfig.hosts,
  port: {
    client: skuConfig.port,
    server: skuConfig.serverPort
  },
  storybookPort: skuConfig.storybookPort,
  polyfills: skuConfig.polyfills,
  initialPath: skuConfig.initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig
};
