const fs = require('fs');
const { getPathFromCwd } = require('../lib/cwd');
const args = require('../config/args');
const defaultSkuConfig = require('./defaultSkuConfig');
const { getClientEntries, defaultClientEntry } = require('./clientEntries');
const validateConfig = require('./validateConfig');

const appSkuConfigPath = getPathFromCwd(args.config);

const appSkuConfig = fs.existsSync(appSkuConfigPath)
  ? require(appSkuConfigPath)
  : {};

const skuConfig = {
  ...defaultSkuConfig,
  ...appSkuConfig
};

validateConfig(skuConfig);

const env = {
  ...skuConfig.env,
  SKU_TENANT: args.tenant
};

const isStartScript = args.script === 'start-ssr' || args.script === 'start';
const isBuildScript = args.script === 'build-ssr' || args.script === 'build';

const transformOutputPath = isStartScript
  ? skuConfig.devTransformOutputPath
  : skuConfig.transformOutputPath;

// Default initialPath to the first route
const initialPath = skuConfig.initialPath || skuConfig.routes[0].route;

const paths = {
  src: skuConfig.srcPaths.map(getPathFromCwd),
  compilePackages: [
    'seek-style-guide',
    'seek-asia-style-guide',
    'braid-design-system',
    ...skuConfig.compilePackages
  ],
  clientEntries: getClientEntries(skuConfig),
  renderEntry: getPathFromCwd(skuConfig.renderEntry),
  libraryEntry: skuConfig.libraryEntry
    ? getPathFromCwd(skuConfig.libraryEntry)
    : null,
  serverEntry: getPathFromCwd(skuConfig.serverEntry),
  public: getPathFromCwd(skuConfig.public),
  target: getPathFromCwd(skuConfig.target),
  relativeTarget: skuConfig.target,
  publicPath: isStartScript ? '/' : skuConfig.publicPath,
  setupTests: skuConfig.setupTests ? getPathFromCwd(skuConfig.setupTests) : null
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
  isLibrary: Boolean(skuConfig.libraryEntry),
  storybookPort: skuConfig.storybookPort,
  polyfills: skuConfig.polyfills,
  initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig,
  sites: skuConfig.sites,
  routes: skuConfig.routes,
  environments: skuConfig.environments,
  transformOutputPath,
  defaultClientEntry,
  isStartScript,
  isBuildScript
};
