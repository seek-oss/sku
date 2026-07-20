import type { SkuConfig, SkuRoute, SkuRouteObject } from '../types/types.js';
import { getPathFromCwd, requireFromCwd } from '@sku-private/utils';
import { existsSync } from 'node:fs';
import defaultSkuConfig from './defaultSkuConfig.js';
import validateConfig from './validateConfig.js';
import {
  defaultCompilePackages,
  detectedCompilePackages,
  detectedCompilePackagesSync,
} from './defaultCompilePackages.js';
import defaultClientEntry from './defaultClientEntry.js';
import { createDebug } from 'obug';
import { resolveAppSkuConfigPath } from './configPath.js';

import { getCjsInteropDeps } from './cjsInteropDeps.js';
import type { PackageJson } from 'type-fest';
import { createJiti } from 'jiti';
import { validatePathAliases } from './validatePathAliases.js';

const jiti = createJiti(import.meta.url);

const debug = createDebug('sku:config');

interface SkuContextOptions {
  configPath?: string;
  port?: number;
  strictPort?: boolean;
}
let storedSkuContext: SkuContext;

export const getSkuContext = async (
  skuContextOptions: SkuContextOptions = {},
) => {
  if (storedSkuContext) {
    return storedSkuContext;
  }
  storedSkuContext = await createSkuContext(skuContextOptions);
  return storedSkuContext;
};

const getSkuConfig = async ({
  configPath,
}: {
  configPath?: string;
}): Promise<{
  appSkuConfig: SkuConfig;
  appSkuConfigPath?: string;
  configPath?: string;
}> => {
  const appSkuConfigPath = resolveAppSkuConfigPath({ configPath });

  if (!appSkuConfigPath) {
    debug('No sku config file found. Using default configuration.');
    return {
      appSkuConfig: {},
      appSkuConfigPath: undefined,
    };
  }

  const appSkuConfig = await jiti.import<SkuConfig>(appSkuConfigPath, {
    default: true,
  });

  return {
    appSkuConfig,
    appSkuConfigPath,
    configPath: appSkuConfigPath.split('/').pop(),
  };
};

export type NormalizedRoute = SkuRouteObject & { siteIndex?: number };

export const createSkuContext = async ({
  configPath,
  port: portArg,
  strictPort,
}: SkuContextOptions) => {
  const {
    appSkuConfig,
    appSkuConfigPath,
    configPath: appConfigPath,
  } = await getSkuConfig({ configPath });

  const skuConfig = {
    ...defaultSkuConfig,
    ...appSkuConfig,
  } satisfies SkuConfig;

  validateConfig(skuConfig, appSkuConfig);

  validatePathAliases(skuConfig.pathAliases);

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

  const getSetupTests = (setupTests?: string | string[]) => {
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

  if (devServerMiddleware && !existsSync(devServerMiddleware)) {
    throw new Error(
      `${devServerMiddleware} does not exist. Please create the file or remove 'devServerMiddleware' from your sku config.`,
    );
  }

  const paths = {
    // Can technically be undefined, in which case we use the default sku config.
    // Maybe we shouldn't have a default sku config at all and just throw if it doesn't exist.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    appSkuConfigPath: appSkuConfigPath!,
    devServerMiddleware,
    src: skuConfig.srcPaths.map(getPathFromCwd),
    async compilePackages() {
      const { names: detectedCompilePackageNames } =
        await detectedCompilePackages();
      return [
        ...detectedCompilePackageNames,
        ...defaultCompilePackages,
        ...skuConfig.compilePackages,
      ];
    },
    compilePackagesSync() {
      const { names: detectedCompilePackageNames } =
        detectedCompilePackagesSync();
      return [
        ...detectedCompilePackageNames,
        ...defaultCompilePackages,
        ...skuConfig.compilePackages,
      ];
    },
    clientEntry: getPathFromCwd(skuConfig.clientEntry),
    renderEntry: getPathFromCwd(skuConfig.renderEntry),
    libraryEntry: skuConfig.libraryEntry
      ? getPathFromCwd(skuConfig.libraryEntry)
      : null,
    serverEntry: getPathFromCwd(skuConfig.serverEntry),
    public: getPathFromCwd(skuConfig.public),
    target: getPathFromCwd(skuConfig.target),
    relativeTarget: skuConfig.target,
    publicPath,
    setupTests: getSetupTests(skuConfig.setupTests),
  };

  const hosts = skuConfig.hosts;
  const port = {
    client: portArg || skuConfig.port,
    server: skuConfig.serverPort,
    strictPort: strictPort || false,
  };
  const libraryName = skuConfig.libraryName;
  const libraryFile = skuConfig.libraryFile;
  const isLibrary = Boolean(skuConfig.libraryEntry);
  const polyfills = skuConfig.polyfills;
  const webpackDecorator = skuConfig.dangerouslySetWebpackConfig;
  const jestDecorator = skuConfig.dangerouslySetJestConfig;
  const eslintDecorator = skuConfig.dangerouslySetESLintConfig;
  const tsconfigDecorator = skuConfig.dangerouslySetTSConfig;
  const viteDecorator = skuConfig.dangerouslySetViteConfig;
  const vitestDecorator = skuConfig.dangerouslySetVitestConfig;
  const vitePlugins = skuConfig.vitePlugins;
  const eslintIgnore = skuConfig.eslintIgnore;
  const routes = normalizedRoutes;
  const environments = skuConfig.environments;
  const supportedBrowsers = skuConfig.supportedBrowsers;
  const sourceMapsProd = Boolean(skuConfig.sourceMapsProd);
  const displayNamesProd = Boolean(skuConfig.displayNamesProd);
  const cspEnabled = skuConfig.cspEnabled;
  const cspDelivery = skuConfig.cspDelivery;
  const cspExtraScriptSrcHosts = skuConfig.cspExtraScriptSrcHosts;
  const cspReportOnlyEnabled = skuConfig.cspReportOnlyEnabled;
  const cspReportOnlyExtraScriptSrcHosts =
    skuConfig.cspReportOnlyExtraScriptSrcHosts ?? cspExtraScriptSrcHosts;
  const httpsDevServer = skuConfig.httpsDevServer;
  const languages = normalizedLanguages;
  const skipPackageCompatibilityCompilation =
    skuConfig.skipPackageCompatibilityCompilation;
  const externalizeNodeModules = skuConfig.externalizeNodeModules;

  const pathAliases = skuConfig.pathAliases;

  const defaultCjsInteropDependencies = ['lodash'];

  const packageJson: PackageJson = requireFromCwd('./package.json');
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const dependsOnApolloClient = Boolean(allDeps['@apollo/client']);

  const cjsInteropDependencies = [
    ...defaultCjsInteropDependencies,
    ...skuConfig.__UNSAFE_EXPERIMENTAL__cjsInteropDependencies,
  ];

  // TODO: Remove logic specific to apollo client in next sku major, assuming uptake of apollo
  // client v4 is good enough. Consumer still on v3 will need to manually configure CJS interop.
  const { serveCjsInteropDependencies, buildCjsInteropDependencies } =
    getCjsInteropDeps({
      dependsOnApolloClient,
      cjsInteropDependencies,
    });

  return {
    bundler: skuConfig.bundler,
    buildType: skuConfig.buildType,
    testRunner: skuConfig.testRunner,
    configPath: appConfigPath,
    publicPath,
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
    viteDecorator,
    vitestDecorator,
    vitePlugins,
    eslintIgnore,
    pathAliases,
    routes,
    environments,
    supportedBrowsers,
    sourceMapsProd,
    displayNamesProd,
    cspEnabled,
    cspDelivery,
    cspExtraScriptSrcHosts,
    cspReportOnlyEnabled,
    cspReportOnlyExtraScriptSrcHosts,
    cspReportOnlyReportTo: skuConfig.cspReportOnlyReportTo,
    httpsDevServer,
    languages,
    initialPath,
    transformOutputPath: skuConfig.transformOutputPath,
    sites,
    skipPackageCompatibilityCompilation,
    externalizeNodeModules,
    defaultClientEntry,
    serveCjsInteropDependencies,
    buildCjsInteropDependencies,
    /** Explicit `compilePackages` from sku config (not defaults / auto-detected). */
    configuredCompilePackages: skuConfig.compilePackages ?? [],
  };
};

type ExtraSkuContextOptions = {
  convertLoadable?: boolean;
  commandName?: string;
  listUrls?: boolean;
};

export type SkuContext = Awaited<ReturnType<typeof createSkuContext>> &
  ExtraSkuContextOptions;
