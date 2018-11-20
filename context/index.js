const fs = require('fs');
const { merge } = require('lodash');
const chalk = require('chalk');
const { getPathFromCwd } = require('../lib/cwd');
const args = require('../config/args');
const defaultSkuConfig = require('./defaultSkuConfig');

const appSkuConfigPath = getPathFromCwd(args.config);

const appSkuConfig = fs.existsSync(appSkuConfigPath)
  ? require(appSkuConfigPath)
  : {};
const skuConfig = merge(defaultSkuConfig, appSkuConfig);

// Validate config
if (skuConfig.entry.library && !skuConfig.libraryName) {
  console.log(
    chalk.red(
      "Error: In your sku config, you've provided 'entry.library' without a corresponding 'libraryName' option."
    )
  );
  process.exit(1);
}

const env = {
  ...skuConfig.env,
  SKU_TENANT: args.tenant
};

const isStartScript = args.script === 'start-ssr' || args.script === 'start';
const isBuildScript = args.script === 'build-ssr' || args.script === 'build';

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
  libraryEntry: skuConfig.entry.library
    ? getPathFromCwd(skuConfig.entry.library)
    : null,
  serverEntry: getPathFromCwd(skuConfig.entry.server),
  public: getPathFromCwd(skuConfig.public),
  target: getPathFromCwd(skuConfig.target),
  publicPath: isStartScript ? '/' : skuConfig.publicPath
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
  libraryName: skuConfig.libraryName,
  storybookPort: skuConfig.storybookPort,
  polyfills: skuConfig.polyfills,
  initialPath: skuConfig.initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig,
  isStartScript,
  isBuildScript
};
