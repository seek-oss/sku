import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import webpack, { type Configuration } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import nodeExternals from 'webpack-node-externals';
import LoadablePlugin from '@loadable/webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { bundleAnalyzerPlugin } from './plugins/bundleAnalyzer.js';
import SkuWebpackPlugin from './plugins/sku-webpack-plugin/index.js';
import MetricsPlugin from './plugins/metrics-plugin/index.js';
import { VocabWebpackPlugin } from '@vocab/webpack';

import { JAVASCRIPT, resolvePackage } from './utils/index.js';
import { cwd } from '@/utils/cwd.js';

import { getVocabConfig } from '@/services/vocab/config/vocab.js';
import getStatsConfig from './statsConfig.js';
import getSourceMapSetting from './sourceMaps.js';
import getCacheSettings from './cache.js';
import modules from './resolveModules.js';
import targets from '@/config/targets.json' with { type: 'json' };
import type { MakeWebpackConfigOptions } from './types.js';

const require = createRequire(import.meta.url);

const renderEntry = require.resolve('../entry/render');
const libraryRenderEntry = require.resolve('../entry/libraryRender');
const __dirname = dirname(fileURLToPath(import.meta.url));

// TODO: HtmlRenderPlugin needs proper typing.
const makeWebpackConfig = ({
  isIntegration = false,
  isDevServer = false,
  htmlRenderPlugin,
  metrics = false,
  hot = false,
  isStartScript = false,
  stats,
  skuContext,
}: MakeWebpackConfigOptions): Configuration[] => {
  const {
    paths,
    webpackDecorator,
    polyfills,
    isLibrary,
    libraryName,
    libraryFile,
    supportedBrowsers,
    displayNamesProd,
    cspEnabled,
    cspExtraScriptSrcHosts,
    rootResolution,
    skipPackageCompatibilityCompilation,
    externalizeNodeModules,
    sourceMapsProd,
  } = skuContext;
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const webpackMode = isProductionBuild ? 'production' : 'development';

  const vocabOptions = getVocabConfig(skuContext);

  const resolvedPolyfills =
    polyfills?.map((polyfill) =>
      require.resolve(polyfill, { paths: [cwd()] }),
    ) || [];

  const skuClientEntry = require.resolve('../entry/client/index.js');

  const createEntry = (entry: string): string[] => [
    ...resolvedPolyfills,
    entry,
  ];

  // Add polyfills and dev server client to all entries
  const clientEntry = isLibrary
    ? createEntry(paths.libraryEntry || '')
    : createEntry(skuClientEntry);

  const internalInclude = [
    path.join(__dirname, '../entry'),
    ...(paths.src || []),
  ];

  const getFileMask = ({
    isMainChunk,
  }: {
    isMainChunk: boolean;
  }): any | string => {
    // Libraries should always have the same file name
    // for the main chunk unless we're building for storybook
    if (isLibrary && isMainChunk) {
      return libraryFile ?? libraryName;
    }

    // The client file mask is set to just name in start/dev mode as contenthash
    // is not supported for hot reloading. It can also cause non
    // deterministic snapshots in jest tests.
    if (!isProductionBuild) {
      return '[name]';
    }

    // Production builds should contain contenthash for optimal file caching
    return '[name]-[contenthash]';
  };

  const jsFileMask = `${getFileMask({ isMainChunk: true })}.js`;
  const jsChunkFileMask = `${getFileMask({ isMainChunk: false })}.js`;

  const cssFileMask = `${getFileMask({ isMainChunk: true })}.css`;
  const cssChunkFileMask = `${getFileMask({ isMainChunk: false })}.css`;

  return [
    {
      name: 'client',
      mode: webpackMode,
      target: `browserslist:${supportedBrowsers}`,
      entry: {
        main: clientEntry,
      },
      devtool: getSourceMapSetting({ isDevServer, sourceMapsProd }),
      output: {
        path: paths.target,
        publicPath: isStartScript ? '/' : paths.publicPath,
        filename: jsFileMask,
        chunkFilename: jsChunkFileMask,
        ...(isLibrary
          ? {
              library: {
                name: libraryName,
                type: 'umd',
                export: 'default',
              },
            }
          : {}),
      },
      cache: getCacheSettings({ isDevServer, paths }),
      optimization: {
        nodeEnv: process.env.NODE_ENV,
        minimize: isProductionBuild,
        // The 'TerserPlugin' is actually the default minimizer for webpack
        // We add a custom one to ensure licence comments stay inside the final JS assets
        // Without this a '*.js.LICENSE.txt' file would be created alongside
        minimizer: [
          new TerserPlugin({
            extractComments: false,
            minify: TerserPlugin.swcMinify,
            parallel: true,
            terserOptions: {
              compress: true,
              mangle: true,
            },
          }),
        ],
        concatenateModules: isProductionBuild,
        ...(!isLibrary
          ? {
              splitChunks: { chunks: 'all' },
              runtimeChunk: { name: 'runtime' },
            }
          : {}),
        emitOnErrors: isProductionBuild,
      },
      resolve: {
        alias: { __sku_alias__clientEntry: paths.clientEntry },
        modules,
      },
      module: {
        rules: [
          ...(isDevServer || isIntegration
            ? []
            : [
                {
                  test: JAVASCRIPT,
                  exclude: [
                    ...internalInclude,
                    /**
                     * - Prevent running `react-dom` & `react` as they already meet our browser support policy
                     */
                    ...[
                      ...paths.compilePackages,
                      ...skipPackageCompatibilityCompilation,
                      'react-dom',
                      'react',
                    ].map((packageName) => {
                      const resolvedPackage = resolvePackage(packageName);

                      return `${resolvedPackage}${path.sep}`;
                    }),
                  ],
                  use: [
                    {
                      loader: require.resolve('babel-loader'),
                      options: {
                        babelrc: false,
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: [
                          [
                            require.resolve('@babel/preset-env'),
                            { modules: false, targets: supportedBrowsers },
                          ],
                        ],
                      },
                    },
                  ],
                },
              ]),
          { test: /\.mjs$/, type: 'javascript/auto' },
        ],
      },
      plugins: [
        ...(htmlRenderPlugin
          ? [
              htmlRenderPlugin.statsCollectorPlugin,
              new LoadablePlugin({
                writeToDisk: false,
                outputAsset: false,
              }),
            ]
          : []),
        ...(isDevServer || isIntegration
          ? []
          : [bundleAnalyzerPlugin({ name: 'client' })]),
        new webpack.DefinePlugin({
          __SKU_CLIENT_PATH__: JSON.stringify(
            path.relative(cwd(), paths.clientEntry),
          ),
        }),
        new MiniCssExtractPlugin({
          filename: cssFileMask,
          chunkFilename: cssChunkFileMask,
        }),
        new SkuWebpackPlugin({
          target: 'browser',
          hot,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          browserslist: supportedBrowsers,
          mode: webpackMode,
          libraryName,
          generateCSSTypes: true,
          displayNamesProd,
          removeAssertionsInProduction: !isIntegration,
          MiniCssExtractPlugin,
          rootResolution,
        }),
        ...(hot ? [new ReactRefreshWebpackPlugin()] : []),
        ...(metrics
          ? [new MetricsPlugin({ type: 'static', target: 'browser' })]
          : []),
        ...(vocabOptions ? [new VocabWebpackPlugin(vocabOptions)] : []),
      ],
      stats: getStatsConfig({
        stats,
        isStartScript,
      }),
      infrastructureLogging: {
        level: 'error',
      },
    },
    {
      name: 'render',
      mode: 'development',
      entry: { main: isLibrary ? libraryRenderEntry : renderEntry },
      // Target the currently running version of node as the
      // render will run within the same process
      target: `browserslist:${targets.browserslistNodeTarget}`,
      externals: [
        // Don't bundle or transpile non-compiled packages if externalizeNodeModules is enabled
        externalizeNodeModules
          ? nodeExternals({
              allowlist: [
                // Include '@babel/runtime' in render builds to workaround ESM imports in html-render-webpack-plugin
                /@babel\/runtime/,

                // webpack-node-externals compares the `import` or `require` expression to this list,
                // not the package name, so we map each packageName to a pattern. This ensures it
                // matches when importing a file within a package e.g. import { MyComponent } from '@seek/my-component-package'.
                ...paths.compilePackages.map(
                  (packageName) => new RegExp(`^(${packageName})`),
                ),
              ],
            })
          : {},
      ],
      output: {
        path: paths.target,
        publicPath: isStartScript ? '/' : paths.publicPath,
        filename: 'render.js',
        library: { name: 'static', type: 'umd2', export: 'default' },
      },
      cache: getCacheSettings({ isDevServer, paths }),
      optimization: {
        nodeEnv: process.env.NODE_ENV,
      },
      resolve: {
        alias: { __sku_alias__renderEntry: paths.renderEntry },
        modules,
      },
      module: {
        rules: [{ test: /\.mjs$/, type: 'javascript/auto' }],
      },
      plugins: [
        ...(htmlRenderPlugin ? [htmlRenderPlugin.rendererPlugin] : []),
        new webpack.DefinePlugin({
          __SKU_LIBRARY_NAME__: JSON.stringify(libraryName),
          __SKU_LIBRARY_FILE__: JSON.stringify(libraryFile),
          __SKU_PUBLIC_PATH__: JSON.stringify(
            isStartScript ? '/' : paths.publicPath,
          ),
          __SKU_CSP__: JSON.stringify({
            enabled: cspEnabled,
            extraHosts: cspExtraScriptSrcHosts,
          }),
        }),
        new SkuWebpackPlugin({
          target: 'node',
          hot: false,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          browserslist: [targets.browserslistNodeTarget],
          mode: webpackMode,
          libraryName,
          displayNamesProd,
          removeAssertionsInProduction: !isIntegration,
          MiniCssExtractPlugin,
          rootResolution,
        }),
        ...(metrics
          ? [new MetricsPlugin({ type: 'static', target: 'node' })]
          : []),
      ],
      infrastructureLogging: {
        level: 'error',
      },
    },
  ].map(webpackDecorator);
};

export default makeWebpackConfig;
