import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { red, bold } from 'chalk';
import { register } from 'esbuild-register/dist/node';
import { getPathFromCwd } from '../lib/cwd';
import defaultSkuConfig from './defaultSkuConfig';
import defaultClientEntry from './defaultClientEntry';
import validateConfig from './validateConfig';

import defaultCompilePackages from './defaultCompilePackages';
import isCompilePackage from '../lib/isCompilePackage';
import { esbuildNodeTarget } from '../config/targets.json' with { type: 'json' };
import { getConfigPath } from './configPath.js';
import { createRequire } from 'node:module';

/** @typedef {import("../sku-types.d.ts").SkuConfig} SkuConfig */

/** @returns {{ appSkuConfig: SkuConfig, appSkuConfigPath: string | null }} */
const getSkuConfig = () => {
  let appSkuConfigPath;
  const tsPath = getPathFromCwd('sku.config.ts');
  const jsPath = getPathFromCwd('sku.config.js');

  const customSkuConfig = getConfigPath() || process.env.SKU_CONFIG;

  if (customSkuConfig) {
    appSkuConfigPath = getPathFromCwd(customSkuConfig);
  } else if (existsSync(tsPath)) {
    appSkuConfigPath = tsPath;
  } else if (existsSync(jsPath)) {
    appSkuConfigPath = jsPath;
  } else {
    return {
      appSkuConfig: {},
      appSkuConfigPath: null,
    };
  }

  const require = createRequire(import.meta.url);
  // Target sku's minimum supported node version
  const { unregister } = register({ target: esbuildNodeTarget });

  const newConfig = require(appSkuConfigPath);

  unregister();

  return {
    appSkuConfig: newConfig.default || newConfig,
    appSkuConfigPath,
  };
};

const { appSkuConfig, appSkuConfigPath } = getSkuConfig();

/** @type {SkuConfig} */
const skuConfig = {
  ...defaultSkuConfig,
  ...appSkuConfig,
};

validateConfig(skuConfig);

if (isCompilePackage && skuConfig.rootResolution) {
  console.log(
    red(
      `Error: "${bold(
        'rootResolution',
      )}" is not safe for compile packages as consuming apps can't resolve them.`,
    ),
  );
  process.exit(1);
}

const firstArg = process.argv[2];

const isStartScript = firstArg === 'start' || firstArg === 'start-ssr';
const isBuildScript = firstArg === 'build' || firstArg === 'build-ssr';

/**
 * @typedef {import('../sku-types.d.ts').SkuRouteObject} SkuRouteObject
 * @typedef {SkuRouteObject & { siteIndex?: number }} NormalizedSkuRoute
 */

/**
 * @param {import('../sku-types.d.ts').SkuRoute} route
 * @returns {NormalizedSkuRoute}
 */
const normalizeRoute = (route) =>
  typeof route === 'string' ? { route } : route;

const normalizedRoutes = skuConfig.routes.map(normalizeRoute);

skuConfig.sites.forEach((site, siteIndex) => {
  if (typeof site !== 'string' && site.routes) {
    normalizedRoutes.push(
      ...site.routes.map((route) => ({
        ...normalizeRoute(route),
        siteIndex,
      })),
    );
  }
});

if (normalizedRoutes.length === 0) {
  normalizedRoutes.push({ name: 'default', route: '/' });
}

const normalizedLanguages = skuConfig.languages
  ? skuConfig.languages.map((lang) =>
      typeof lang === 'string' ? { name: lang } : lang,
    )
  : null;

const startTransformPath = ({ site = '', route = '' }) => join(site, route);

const transformOutputPath = isStartScript
  ? startTransformPath
  : skuConfig.transformOutputPath;

const getSetupTests = (setupTests) => {
  if (!setupTests) {
    return [];
  }

  if (Array.isArray(setupTests)) {
    return setupTests.map((setupTest) => getPathFromCwd(setupTest));
  }

  return [getPathFromCwd(setupTests)];
};

// normalize sites to object syntax
const sites = skuConfig.sites.map((site) =>
  typeof site === 'string' ? { name: site } : site,
);

// Default initialPath to the first route
const initialPath = skuConfig.initialPath || normalizedRoutes[0].route;

const publicPath = skuConfig.publicPath.endsWith('/')
  ? skuConfig.publicPath
  : `${skuConfig.publicPath}/`;

const devServerMiddleware =
  skuConfig.devServerMiddleware &&
  getPathFromCwd(skuConfig.devServerMiddleware);

const useDevServerMiddleware = devServerMiddleware
  ? existsSync(devServerMiddleware)
  : false;

if (devServerMiddleware && !useDevServerMiddleware) {
  throw new Error(
    `${devServerMiddleware} does not exist. Please create the file or remove 'devServerMiddleware' from your sku config.`,
  );
}

const paths = {
  appSkuConfigPath,
  devServerMiddleware,
  src: skuConfig.srcPaths.map(getPathFromCwd),
  /** @type {string[]} */
  compilePackages: [...defaultCompilePackages, ...skuConfig.compilePackages],
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
};

export default {
  paths,
  locales: skuConfig.locales,
  hosts: skuConfig.hosts,
  port: {
    client: skuConfig.port,
    server: skuConfig.serverPort,
  },
  libraryName: skuConfig.libraryName,
  libraryFile: skuConfig.libraryFile,
  isLibrary: Boolean(skuConfig.libraryEntry),
  polyfills: skuConfig.polyfills,
  initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig,
  tsconfigDecorator: skuConfig.dangerouslySetTSConfig,
  eslintIgnore: skuConfig.eslintIgnore,
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
  cspEnabled: skuConfig.cspEnabled,
  cspExtraScriptSrcHosts: skuConfig.cspExtraScriptSrcHosts,
  httpsDevServer: skuConfig.httpsDevServer,
  useDevServerMiddleware,
  rootResolution: skuConfig.rootResolution,
  languages: normalizedLanguages,
  skipPackageCompatibilityCompilation:
    skuConfig.skipPackageCompatibilityCompilation,
  externalizeNodeModules: skuConfig.externalizeNodeModules,
};
