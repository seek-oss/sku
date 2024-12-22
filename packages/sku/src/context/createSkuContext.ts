import type { SkuConfig, SkuRoute, SkuRouteObject } from '../../sku-types.d.ts';
import { getPathFromCwd } from '@/utils/cwd.js';
import { getConfigPath } from './configPath.js';
import { existsSync } from 'node:fs';
import defaultSkuConfig from './defaultSkuConfig.js';
import validateConfig from './validateConfig.js';
import isCompilePackage from '@/utils/isCompilePackage.js';
import chalk from 'chalk';
import { join } from 'node:path';
import defaultCompilePackages from './defaultCompilePackages.js';
import defaultClientEntry from './defaultClientEntry.js';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

let storedSkuContext: SkuContext | null = null;

export const getSkuContext = async ({
  isStartScript,
  configPath,
}: {
  isStartScript?: boolean;
  configPath?: string;
} = {}) => {
  if (storedSkuContext) {
    return storedSkuContext;
  }
  storedSkuContext = await createSkuContext({ isStartScript, configPath });
  return storedSkuContext;
};

const getSkuConfig = async ({
  configPath,
}: {
  configPath?: string;
}): Promise<{
  appSkuConfig: SkuConfig;
  appSkuConfigPath: string | null;
}> => {
  let appSkuConfigPath;
  const tsPath = getPathFromCwd('sku.config.ts');
  const jsPath = getPathFromCwd('sku.config.js');

  const customSkuConfig = configPath || process.env.SKU_CONFIG;

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

export type NormalizedRoute = SkuRouteObject & { siteIndex?: number };

export const createSkuContext = async ({
  isStartScript,
  configPath,
}: {
  isStartScript?: boolean;
  configPath?: string;
}) => {
  const { appSkuConfig, appSkuConfigPath } = await getSkuConfig({ configPath });

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

  type NormalizedRoute = SkuRouteObject & { siteIndex?: number };

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

  const startTransformPath = ({ site = '', route = '' }) => join(site, route);

  const transformOutputPath = isStartScript
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
    publicPath: isStartScript ? '/' : publicPath,
    setupTests: getSetupTests(skuConfig.setupTests!),
  };

  const hosts = skuConfig.hosts!;
  const port = { client: skuConfig.port, server: skuConfig.serverPort };
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

  const skuContext = {
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
    transformOutputPath,
    sites,
    useDevServerMiddleware,
    skipPackageCompatibilityCompilation,
    externalizeNodeModules,
    defaultClientEntry,
  };

  storedSkuContext = skuContext;

  return skuContext;
};

export type SkuContext = Awaited<ReturnType<typeof createSkuContext>>;
