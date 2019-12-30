const fs = require('fs');
const path = require('path');
const { getPathFromCwd } = require('../lib/cwd');
const args = require('../config/args');
const defaultSkuConfig = require('./defaultSkuConfig');
const defaultClientEntry = require('./defaultClientEntry');
const validateConfig = require('./validateConfig');

const appSkuConfigPath = getPathFromCwd(args.config);

const appSkuConfig = fs.existsSync(appSkuConfigPath)
  ? require(appSkuConfigPath)
  : {};

const skuConfig = {
  ...defaultSkuConfig,
  ...appSkuConfig,
};

validateConfig(skuConfig);

const env = {
  ...skuConfig.env,
  SKU_TENANT: args.tenant,
};

const isStartScript = args.script === 'start-ssr' || args.script === 'start';
const isBuildScript = args.script === 'build-ssr' || args.script === 'build';

const normalizedRoutes = skuConfig.routes.map(route =>
  typeof route === 'string' ? { route } : route,
);

const startTransformPath = ({ site = '', route = '' }) =>
  path.join(site, route);

const transformOutputPath = isStartScript
  ? startTransformPath
  : skuConfig.transformOutputPath;

const getSetupTests = setupTests => {
  if (!setupTests) {
    return [];
  }

  if (Array.isArray(setupTests)) {
    return setupTests.map(setupTest => getPathFromCwd(setupTest));
  }

  return [getPathFromCwd(setupTests)];
};

// normalize sites to object syntax
const sites = skuConfig.sites.map(site =>
  typeof site === 'string' ? { name: site } : site,
);

// Default initialPath to the first route
const initialPath = skuConfig.initialPath || normalizedRoutes[0].route;

const publicPath = skuConfig.publicPath.endsWith('/')
  ? skuConfig.publicPath
  : `${skuConfig.publicPath}/`;

const paths = {
  src: skuConfig.srcPaths.map(getPathFromCwd),
  compilePackages: [
    'sku',
    'seek-style-guide',
    'seek-asia-style-guide',
    'braid-design-system',
    ...skuConfig.compilePackages,
  ],
  clientEntry: getPathFromCwd(skuConfig.clientEntry),
  renderEntry: getPathFromCwd(skuConfig.renderEntry),
  libraryEntry: skuConfig.libraryEntry
    ? getPathFromCwd(skuConfig.libraryEntry)
    : null,
  serverEntry: getPathFromCwd(skuConfig.serverEntry),
  public: getPathFromCwd(skuConfig.public),
  target: getPathFromCwd(skuConfig.target),
  relativeTarget: skuConfig.target,
  publicPath: isStartScript ? '/' : publicPath,
  setupTests: getSetupTests(skuConfig.setupTests),
  storybookTarget: getPathFromCwd(skuConfig.storybookTarget),
  playroomTarget: getPathFromCwd(skuConfig.playroomTarget),
  playroomComponents: getPathFromCwd(skuConfig.playroomComponents),
  playroomThemes: skuConfig.playroomThemes
    ? getPathFromCwd(skuConfig.playroomThemes)
    : null,
  playroomFrameComponent: skuConfig.playroomFrameComponent
    ? getPathFromCwd(skuConfig.playroomFrameComponent)
    : null,
};

module.exports = {
  paths,
  env,
  locales: skuConfig.locales,
  hosts: skuConfig.hosts,
  port: {
    client: skuConfig.port,
    server: skuConfig.serverPort,
  },
  libraryName: skuConfig.libraryName,
  isLibrary: Boolean(skuConfig.libraryEntry),
  storybookPort: skuConfig.storybookPort,
  storybookTarget: skuConfig.storybookTarget,
  screenshotWidths: skuConfig.screenshotWidths,
  polyfills: skuConfig.polyfills,
  initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig,
  routes: normalizedRoutes,
  sites,
  environments: skuConfig.environments,
  transformOutputPath,
  defaultClientEntry,
  isStartScript,
  isBuildScript,
  supportedBrowsers: skuConfig.supportedBrowsers,
  sourceMapsProd: Boolean(skuConfig.sourceMapsProd),
  displayNamesProd: Boolean(skuConfig.displayNamesProd),
  playroom: {
    port: skuConfig.playroomPort,
    widths: skuConfig.playroomWidths,
    title: skuConfig.playroomTitle,
    themes: skuConfig.playroomThemes,
  },
};
