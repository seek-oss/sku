const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');
const path = require('path');
const LoadablePlugin = require('@loadable/webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const args = require('../args');
const config = require('../../context');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const SkuWebpackPlugin = require('./plugins/sku-webpack-plugin');
const MetricsPlugin = require('./plugins/metrics-plugin');
const VocabWebpackPlugin = require('@vocab/webpack').default;

const utils = require('./utils');
const debug = require('debug')('sku:webpack:config');
const { cwd } = require('../../lib/cwd');
const isTypeScript = require('../../lib/isTypeScript');

const renderEntry = require.resolve('../../entry/render');
const libraryRenderEntry = require.resolve('../../entry/libraryRender');

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
  languages,
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

  const isMultiLanguageMode = Boolean(languages);
  const vocabOptions = {
    devLanguage: 'en',
    languages,
  };

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

  const devServerEntries = [
    `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}/`,
  ];

  const skuClientEntry = require.resolve('../../entry/client/index.js');

  const createEntry = (entry) => [
    ...resolvedPolyfills,
    ...(isDevServer ? devServerEntries : []),
    entry,
  ];

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

  const webpackConfigs = [
    {
      name: 'client',
      mode: webpackMode,
      entry: {
        main: clientEntry,
        ...(isDevServer && !isLibrary
          ? { devServerOnly: devServerEntries }
          : {}),
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
        concatenateModules: isProductionBuild,
        ...(!isLibrary
          ? {
              splitChunks: { chunks: 'all' },
              runtimeChunk: { name: 'runtime' },
            }
          : {}),
      },
      resolve: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
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
                    internalInclude,
                    ...paths.compilePackages.map(utils.resolvePackage),

                    // Playroom source is managed by its own webpack config
                    path.dirname(require.resolve('playroom/package.json')),

                    // Prevent running `react-dom` through babel as it's
                    // too large and already meets our browser support policy
                    path.dirname(require.resolve('react-dom/package.json')),
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
        ...(isDevServer
          ? [
              new webpack.DefinePlugin({
                __SKU_CLIENT_PATH__: JSON.stringify(
                  path.relative(cwd(), paths.clientEntry),
                ),
              }),
            ]
          : []),
        ...(hot
          ? [
              new webpack.HotModuleReplacementPlugin(),
              new ReactRefreshWebpackPlugin(),
            ]
          : []),
        new MiniCssExtractPlugin({
          filename: cssFileMask,
          chunkFilename: cssChunkFileMask,
        }),
        new SkuWebpackPlugin({
          target: 'browser',
          hot,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          supportedBrowsers,
          mode: webpackMode,
          libraryName,
          generateCSSTypes: isTypeScript,
          displayNamesProd,
          removeAssertionsInProduction: !isIntegration,
          MiniCssExtractPlugin,
          rootResolution,
        }),
        ...(metrics
          ? [new MetricsPlugin({ type: 'static', target: 'browser' })]
          : []),
        ...(isMultiLanguageMode ? [new VocabWebpackPlugin(vocabOptions)] : []),
      ],
    },
    {
      name: 'render',
      mode: 'development',
      entry: { main: isLibrary ? libraryRenderEntry : renderEntry },
      target: 'node',
      externals: [
        // Don't bundle or transpile non-compiled packages
        nodeExternals({
          // webpack-node-externals compares the `import` or `require` expression to this list,
          // not the package name, so we map each packageName to a pattern. This ensures it
          // matches when importing a file within a package e.g. import { Text } from 'seek-style-guide/react'.
          whitelist: paths.compilePackages.map(
            (packageName) => new RegExp(`^(${packageName})`),
          ),
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
      resolve: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
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
          supportedBrowsers,
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
        ...(isMultiLanguageMode ? [new VocabWebpackPlugin(vocabOptions)] : []),
      ],
    },
  ].map(webpackDecorator);

  debug(JSON.stringify(webpackConfigs));

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
