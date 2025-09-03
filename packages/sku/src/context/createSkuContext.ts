import type { SkuConfig, SkuRoute, SkuRouteObject } from '../types/types.d.ts';
import { getPathFromCwd } from '../utils/cwd.js';
import { existsSync } from 'node:fs';
import defaultSkuConfig from './defaultSkuConfig.js';
import validateConfig from './validateConfig.js';
import isCompilePackage from '../utils/isCompilePackage.js';
import chalk from 'chalk';
import defaultCompilePackages from './defaultCompilePackages.js';
import defaultClientEntry from './defaultClientEntry.js';
import _debug from 'debug';
import { resolveAppSkuConfigPath } from './configPath.js';

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);

const createJiti = require('jiti');
const jiti = createJiti(__filename);

const debug = _debug('sku:config');

const generateTypeScriptPaths = (
  pathAliases?: Record<string, string>,
): Record<string, string[]> => {
  const typeScriptPaths: Record<string, string[]> = {};

  // Always include automatic src/* alias, then merge with user-provided aliases
  const mergedAliases = {
    'src/*': './src/*',
    ...pathAliases,
  };

  for (const [alias, destination] of Object.entries(mergedAliases) as Array<
    [string, string]
  >) {
    typeScriptPaths[alias] = [destination];
  }

  return typeScriptPaths;
};

interface SkuContextOptions {
  configPath?: string;
  port?: number;
  strictPort?: boolean;
}
let storedSkuContext: SkuContext;

export const getSkuContext = (skuContextOptions: SkuContextOptions = {}) => {
  if (storedSkuContext) {
    return storedSkuContext;
  }
  storedSkuContext = createSkuContext(skuContextOptions);
  return storedSkuContext;
};

const getSkuConfig = ({
  configPath,
}: {
  configPath?: string;
}): {
  appSkuConfig: SkuConfig;
  appSkuConfigPath?: string;
  configPath?: string;
} => {
  const appSkuConfigPath = resolveAppSkuConfigPath({ configPath });

  if (!appSkuConfigPath) {
    debug('No sku config file found. Using default configuration.');
    return {
      appSkuConfig: {},
      appSkuConfigPath: undefined,
    };
  }

  const mod = jiti(appSkuConfigPath) as { default: SkuConfig } & SkuConfig;

  // Jiti require doesn't support the `default` config so we have to check for `default` ourselves
  const appSkuConfig = mod?.default ?? mod;

  return {
    appSkuConfig,
    appSkuConfigPath,
    configPath: appSkuConfigPath.split('/').pop(),
  };
};

export type NormalizedRoute = SkuRouteObject & { siteIndex?: number };

export const createSkuContext = ({
  configPath,
  port: portArg,
  strictPort,
}: SkuContextOptions) => {
  const {
    appSkuConfig,
    appSkuConfigPath,
    configPath: appConfigPath,
  } = getSkuConfig({ configPath });

  const skuConfig = {
    ...defaultSkuConfig,
    ...appSkuConfig,
  } satisfies SkuConfig;

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

  // Validate pathAliases destinations don't contain node_modules
  if (
    skuConfig.__UNSAFE_EXPERIMENTAL__bundler === 'vite' &&
    skuConfig.pathAliases
  ) {
    for (const [alias, destination] of Object.entries(
      skuConfig.pathAliases,
    ) as Array<[string, string]>) {
      if (destination.includes('node_modules')) {
        console.log(
          chalk.red(
            `Path alias "${chalk.bold(alias)}" cannot point to node_modules.`,
          ),
        );
        process.exit(1);
      }
    }
  }

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

  const normalizedLanguages = skuConfig.languages
    ? skuConfig.languages.map((lang) =>
        typeof lang === 'string' ? { name: lang } : lang,
      )
    : null;

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
  const sites =
    skuConfig.sites?.map((site) =>
      typeof site === 'string' ? { name: site } : site,
    ) || [];

  // Default initialPath to the first route
  const initialPath = skuConfig.initialPath || normalizedRoutes?.[0].route;

  const publicPath = skuConfig.publicPath?.endsWith('/')
    ? skuConfig.publicPath
    : `${skuConfig.publicPath}/`;

  const devServerMiddleware =
    skuConfig.devServerMiddleware &&
    getPathFromCwd(skuConfig.devServerMiddleware);

  const useDevServerMiddleware =
    Boolean(devServerMiddleware) || existsSync(devServerMiddleware!);

  if (devServerMiddleware && !useDevServerMiddleware) {
    throw new Error(
      `${devServerMiddleware} does not exist. Please create the file or remove 'devServerMiddleware' from your sku config.`,
    );
  }

  const paths = {
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
    publicPath,
    setupTests: getSetupTests(skuConfig.setupTests!),
  };

  const hosts = skuConfig.hosts!;
  const port = {
    client: portArg || skuConfig.port,
    server: skuConfig.serverPort,
    strictPort: strictPort || false,
  };
  const libraryName = skuConfig.libraryName!;
  const libraryFile = skuConfig.libraryFile!;
  const isLibrary = Boolean(skuConfig.libraryEntry);
  const polyfills = skuConfig.polyfills!;
  const webpackDecorator = skuConfig.dangerouslySetWebpackConfig!;
  const jestDecorator = skuConfig.dangerouslySetJestConfig!;
  const eslintDecorator = skuConfig.dangerouslySetESLintConfig!;
  const tsconfigDecorator = skuConfig.dangerouslySetTSConfig!;
  const eslintIgnore = skuConfig.eslintIgnore!;
  const routes = normalizedRoutes!;
  const environments = skuConfig.environments!;
  const supportedBrowsers = skuConfig.supportedBrowsers!;
  const sourceMapsProd = Boolean(skuConfig.sourceMapsProd);
  const displayNamesProd = Boolean(skuConfig.displayNamesProd);
  const cspEnabled = skuConfig.cspEnabled!;
  const cspExtraScriptSrcHosts = skuConfig.cspExtraScriptSrcHosts!;
  const httpsDevServer = skuConfig.httpsDevServer!;
  const rootResolution = skuConfig.rootResolution!;
  const languages = normalizedLanguages!;
  const skipPackageCompatibilityCompilation =
    skuConfig.skipPackageCompatibilityCompilation!;
  const externalizeNodeModules = skuConfig.externalizeNodeModules!;

  const tsPaths =
    skuConfig.__UNSAFE_EXPERIMENTAL__bundler === 'vite' ||
    skuConfig.__UNSAFE_EXPERIMENTAL__testRunner === 'vitest'
      ? generateTypeScriptPaths(skuConfig.pathAliases)
      : undefined;

  return {
    bundler: skuConfig.__UNSAFE_EXPERIMENTAL__bundler,
    testRunner: skuConfig.__UNSAFE_EXPERIMENTAL__testRunner,
    configPath: appConfigPath,
    publicPath,
    skuConfig,
    paths,
    hosts,
    port,
    libraryName,
    libraryFile,
    isLibrary,
    polyfills,
    webpackDecorator,
    jestDecorator,
    eslintDecorator,
    tsconfigDecorator,
    eslintIgnore,
    tsPaths,
    routes,
    environments,
    supportedBrowsers,
    sourceMapsProd,
    displayNamesProd,
    cspEnabled,
    cspExtraScriptSrcHosts,
    httpsDevServer,
    rootResolution,
    languages,
    initialPath,
    transformOutputPath: skuConfig.transformOutputPath,
    sites,
    useDevServerMiddleware,
    skipPackageCompatibilityCompilation,
    externalizeNodeModules,
    defaultClientEntry,
  };
};

type ExtraSkuContextOptions = {
  convertLoadable?: boolean;
  commandName?: string;
};

export type SkuContext = ReturnType<typeof createSkuContext> &
  ExtraSkuContextOptions;
