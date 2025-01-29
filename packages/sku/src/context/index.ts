import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { createJiti } from 'jiti';
import { getPathFromCwd } from '../lib/cwd.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import validateConfig from './validateConfig.js';

import defaultCompilePackages from './defaultCompilePackages.js';
import isCompilePackage from '../lib/isCompilePackage.js';
import { getConfigPath } from './configPath.js';
import type { SkuConfig, SkuRoute, SkuRouteObject } from 'sku-types.d.ts';

const jiti = createJiti(import.meta.url);

const getSkuConfig = async (): Promise<{
  appSkuConfig: SkuConfig;
  appSkuConfigPath: string | null;
}> => {
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

  type SkuConfigImportType = SkuConfig | { default: SkuConfig };

  const newConfig = await jiti.import<SkuConfigImportType>(appSkuConfigPath);

  function isDefaultConfig(
    config: SkuConfigImportType,
  ): config is { default: SkuConfig } {
    return (config as { default: SkuConfig }).default !== undefined;
  }

  return {
    appSkuConfig: isDefaultConfig(newConfig) ? newConfig.default : newConfig,
    appSkuConfigPath,
  };
};

const { appSkuConfig, appSkuConfigPath } = await getSkuConfig();

const skuConfig = {
  ...defaultSkuConfig,
  ...appSkuConfig,
};

validateConfig(skuConfig);

if (isCompilePackage && skuConfig.rootResolution) {
  console.log(
    chalk.red(
      `Error: "${chalk.bold(
        'rootResolution',
      )}" is not safe for compile packages as consuming apps can't resolve them.`,
    ),
  );
  process.exit(1);
}

const firstArg = process.argv[2];

export const isStartScript = firstArg === 'start' || firstArg === 'start-ssr';

export type NormalizedRoute = SkuRouteObject & { siteIndex?: number };
const normalizeRoute = (route: SkuRoute): NormalizedRoute =>
  typeof route === 'string' ? { route } : route;

const normalizedRoutes = skuConfig.routes?.map(normalizeRoute);

skuConfig.sites?.forEach((site, siteIndex) => {
  if (typeof site !== 'string' && site.routes) {
    normalizedRoutes?.push(
      ...site.routes.map((route) => ({
        ...normalizeRoute(route),
        siteIndex,
      })),
    );
  }
});

if (normalizedRoutes?.length === 0) {
  normalizedRoutes?.push({ name: 'default', route: '/' });
}

export const normalizedLanguages = skuConfig.languages
  ? skuConfig.languages.map((lang) =>
      typeof lang === 'string' ? { name: lang } : lang,
    )
  : null;

const startTransformPath = ({ site = '', route = '' }) => join(site, route);

export const transformOutputPath = isStartScript
  ? startTransformPath
  : skuConfig.transformOutputPath;

const getSetupTests = (setupTests: string | string[]) => {
  if (!setupTests) {
    return [];
  }

  if (Array.isArray(setupTests)) {
    return setupTests.map((setupTest) => getPathFromCwd(setupTest));
  }

  return [getPathFromCwd(setupTests)];
};

// normalize sites to object syntax
export const sites =
  skuConfig.sites?.map((site) =>
    typeof site === 'string' ? { name: site } : site,
  ) || [];

// Default initialPath to the first route
export const initialPath = skuConfig.initialPath || normalizedRoutes?.[0].route;

export const publicPath = skuConfig.publicPath?.endsWith('/')
  ? skuConfig.publicPath
  : `${skuConfig.publicPath}/`;

const devServerMiddleware =
  skuConfig.devServerMiddleware &&
  getPathFromCwd(skuConfig.devServerMiddleware);

export const useDevServerMiddleware =
  Boolean(devServerMiddleware) || existsSync(devServerMiddleware!);

if (devServerMiddleware && !useDevServerMiddleware) {
  throw new Error(
    `${devServerMiddleware} does not exist. Please create the file or remove 'devServerMiddleware' from your sku config.`,
  );
}

export const paths = {
  appSkuConfigPath: appSkuConfigPath!,
  devServerMiddleware: devServerMiddleware!,
  src: skuConfig.srcPaths!.map(getPathFromCwd),
  compilePackages: [...defaultCompilePackages, ...skuConfig.compilePackages!],
  clientEntry: getPathFromCwd(skuConfig.clientEntry!),
  renderEntry: getPathFromCwd(skuConfig.renderEntry!),
  libraryEntry: skuConfig.libraryEntry
    ? getPathFromCwd(skuConfig.libraryEntry)
    : null,
  serverEntry: getPathFromCwd(skuConfig.serverEntry!),
  public: getPathFromCwd(skuConfig.public!),
  target: getPathFromCwd(skuConfig.target!),
  relativeTarget: skuConfig.target!,
  publicPath: isStartScript ? '/' : publicPath,
  setupTests: getSetupTests(skuConfig.setupTests!),
};

export const hosts = skuConfig.hosts!;
export const port = { client: skuConfig.port, server: skuConfig.serverPort };
export const libraryName = skuConfig.libraryName!;
export const libraryFile = skuConfig.libraryFile!;
export const isLibrary = Boolean(skuConfig.libraryEntry);
export const polyfills = skuConfig.polyfills!;
export const webpackDecorator = skuConfig.dangerouslySetWebpackConfig!;
export const jestDecorator = skuConfig.dangerouslySetJestConfig!;
export const eslintDecorator = skuConfig.dangerouslySetESLintConfig!;
export const tsconfigDecorator = skuConfig.dangerouslySetTSConfig!;
export const eslintIgnore = skuConfig.eslintIgnore!;
export const routes = normalizedRoutes!;
export const environments = skuConfig.environments!;
export const supportedBrowsers = skuConfig.supportedBrowsers!;
export const sourceMapsProd = Boolean(skuConfig.sourceMapsProd);
export const displayNamesProd = Boolean(skuConfig.displayNamesProd);
export const cspEnabled = skuConfig.cspEnabled!;
export const cspExtraScriptSrcHosts = skuConfig.cspExtraScriptSrcHosts!;
export const httpsDevServer = skuConfig.httpsDevServer!;
export { default as defaultClientEntry } from './defaultClientEntry.js';
export const rootResolution = skuConfig.rootResolution!;
export const languages = normalizedLanguages!;
export const skipPackageCompatibilityCompilation =
  skuConfig.skipPackageCompatibilityCompilation!;
export const externalizeNodeModules = skuConfig.externalizeNodeModules!;
