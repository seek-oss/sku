const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');
const path = require('path');
const LoadablePlugin = require('@loadable/webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const args = require('../args');
const config = require('../../context');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const SkuWebpackPlugin = require('./plugins/sku-webpack-plugin');
const MetricsPlugin = require('./plugins/metrics-plugin');
const { VocabWebpackPlugin } = require('@vocab/webpack');

const utils = require('./utils');
const { cwd } = require('../../lib/cwd');
const isTypeScript = require('../../lib/isTypeScript');

const renderEntry = require.resolve('../../entry/render');
const libraryRenderEntry = require.resolve('../../entry/libraryRender');

const { getVocabConfig } = require('../vocab/vocab');
const statsConfig = require('./statsConfig');

const {
  paths,
  env,
  webpackDecorator,
  polyfills,
  isLibrary,
  libraryName,
  sourceMapsProd,
  supportedBrowsers,
  displayNamesProd,
  cspEnabled,
  cspExtraScriptSrcHosts,
  rootResolution,
  skipPackageCompatibilityCompilation,
} = config;

// port is only required for dev builds
const makeWebpackConfig = ({
  isIntegration = false,
  port = 0,
  isDevServer = false,
  htmlRenderPlugin,
  metrics = false,
  hot = false,
} = {}) => {
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const webpackMode = isProductionBuild ? 'production' : 'development';

  const vocabOptions = getVocabConfig();

  const envVars = lodash
    .chain(env)
    .mapValues((value, key) => {
      if (typeof value !== 'object') {
        return JSON.stringify(value);
      }

      const valueForEnv = value[args.env];

      if (typeof valueForEnv === 'undefined') {
        console.log(
          `WARNING: Environment variable "${key}" is missing a value for the "${args.env}" environment`,
        );
        process.exit(1);
      }

      return JSON.stringify(valueForEnv);
    })
    .set('SKU_ENV', JSON.stringify(args.env))
    .set('PORT', JSON.stringify(port))
    .mapKeys((value, key) => `process.env.${key}`)
    .value();

  const resolvedPolyfills = polyfills.map((polyfill) => {
    return require.resolve(polyfill, { paths: [cwd()] });
  });

  const skuClientEntry = require.resolve('../../entry/client/index.js');

  const createEntry = (entry) => [...resolvedPolyfills, entry];

  // Add polyfills and dev server client to all entries
  const clientEntry = isLibrary
    ? createEntry(paths.libraryEntry)
    : createEntry(skuClientEntry);

  const internalInclude = [path.join(__dirname, '../../entry'), ...paths.src];

  const getFileMask = ({ isMainChunk }) => {
    // Libraries should always have the same file name
    // for the main chunk unless we're building for storybook
    if (isLibrary && isMainChunk) {
      return libraryName;
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

  const sourceMapStyle = isDevServer ? 'inline-source-map' : 'source-map';
  const useSourceMaps = isDevServer || sourceMapsProd;
  const nodeTarget = 'current node';

  const webpackConfigs = [
    {
      name: 'client',
      mode: webpackMode,
      target: `browserslist:${supportedBrowsers}`,
      entry: {
        main: clientEntry,
      },
      devtool: useSourceMaps ? sourceMapStyle : false,
      output: {
        path: paths.target,
        publicPath: paths.publicPath,
        filename: jsFileMask,
        chunkFilename: jsChunkFileMask,
        ...(isLibrary
          ? {
              library: libraryName,
              libraryTarget: 'umd',
              libraryExport: 'default',
            }
          : {}),
      },
      optimization: {
        nodeEnv: process.env.NODE_ENV,
        minimize: isProductionBuild,
        // The 'TerserPlugin' is actually the default minimizer for webpack
        // We add a custom one to ensure licence comments stay inside the final JS assets
        // Without this a '*.js.LICENSE.txt' file would be created alongside
        minimizer: [new TerserPlugin({ extractComments: false })],
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
      },
      module: {
        rules: [
          ...(isDevServer || isIntegration
            ? []
            : [
                {
                  test: utils.JAVASCRIPT,
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
                      const resolvedPackage = utils.resolvePackage(packageName);

                      return `${resolvedPackage}${path.sep}`;
                    }),
                  ],
                  use: [
                    {
                      loader: require.resolve('babel-loader'),
                      options: {
                        babelrc: false,
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
          { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
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
        new webpack.DefinePlugin(envVars),
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
          generateCSSTypes: isTypeScript,
          displayNamesProd,
          removeAssertionsInProduction: !isIntegration,
          MiniCssExtractPlugin,
          rootResolution,
        }),
        ...(hot
          ? [
              new ReactRefreshWebpackPlugin({
                overlay: {
                  sockPath: '/ws',
                },
              }),
            ]
          : []),
        ...(metrics
          ? [new MetricsPlugin({ type: 'static', target: 'browser' })]
          : []),
        ...(vocabOptions ? [new VocabWebpackPlugin(vocabOptions)] : []),
      ],
      stats: statsConfig,
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
      target: `browserslist:${nodeTarget}`,
      externals: [
        // Don't bundle or transpile non-compiled packages
        nodeExternals({
          allowlist: [
            'classnames', // Workaround for https://github.com/JedWatson/classnames/issues/240

            // webpack-node-externals compares the `import` or `require` expression to this list,
            // not the package name, so we map each packageName to a pattern. This ensures it
            // matches when importing a file within a package e.g. import { Text } from 'seek-style-guide/react'.
            ...paths.compilePackages.map(
              (packageName) => new RegExp(`^(${packageName})`),
            ),
          ],
        }),
      ],
      output: {
        path: paths.target,
        publicPath: paths.publicPath,
        filename: 'render.js',
        libraryExport: 'default',
        library: 'static',
        libraryTarget: 'umd2',
      },
      optimization: {
        nodeEnv: process.env.NODE_ENV,
      },
      resolve: {
        alias: { __sku_alias__renderEntry: paths.renderEntry },
      },
      module: {
        rules: [
          { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
        ],
      },
      plugins: [
        ...(htmlRenderPlugin ? [htmlRenderPlugin.rendererPlugin] : []),
        new webpack.DefinePlugin(envVars),
        new webpack.DefinePlugin({
          SKU_LIBRARY_NAME: JSON.stringify(libraryName),
          __SKU_PUBLIC_PATH__: JSON.stringify(paths.publicPath),
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
          browserslist: [nodeTarget],
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

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
