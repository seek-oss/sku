const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');
const path = require('path');
const LoadablePlugin = require('@loadable/webpack-plugin');

const args = require('../args');
const config = require('../../context');
const createHtmlRenderPlugin = require('./plugins/createHtmlRenderPlugin');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const createTreatPlugin = require('./plugins/createTreatPlugin');

const utils = require('./utils');
const debug = require('debug')('sku:webpack:config');
const { cwd } = require('../../lib/cwd');

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
} = config;

// port is only required for dev builds
const makeWebpackConfig = ({
  isIntegration = false,
  port = 0,
  isDevServer = false,
} = {}) => {
  const { isProductionBuild } = utils;
  const webpackMode = isProductionBuild ? 'production' : 'development';
  const shouldRenderHtml = () => {
    if (isIntegration) {
      return false;
    }
    if (isLibrary) {
      return isDevServer;
    }
    return true;
  };
  const renderHtml = shouldRenderHtml();
  const htmlRenderPlugin =
    !isDevServer && renderHtml ? createHtmlRenderPlugin() : null;

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

  const resolvedPolyfills = polyfills.map(polyfill => {
    return require.resolve(polyfill, { paths: [cwd()] });
  });

  const devServerEntries = [
    `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}/`,
  ];

  const skuClientEntry = require.resolve('../../entry/client/index.js');

  const createEntry = entry => [
    ...resolvedPolyfills,
    ...(isDevServer ? devServerEntries : []),
    entry,
  ];

  // Add polyfills and dev server client to all entries
  const clientEntry = isLibrary
    ? createEntry(paths.libraryEntry)
    : createEntry(skuClientEntry);

  const internalJs = [
    path.join(__dirname, '../../entry'),
    ...paths.src,
    ...paths.compilePackages.map(utils.resolvePackage),
  ];

  const getFileMask = ({ isMainChunk }) => {
    if (isIntegration) {
      return '[name]';
    }

    // Libraries should always have the same file name
    // for the main chunk unless we're building for storybook
    if (isLibrary && isMainChunk) {
      return libraryName;
    }

    // The client file mask is set to just name in start/dev mode as contenthash
    // is not supported for hot reloading. It can also cause non
    // deterministic snapshots in jest tests.
    if (isDevServer) {
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
          {
            test: /(?!\.css)\.(ts|tsx)$/,
            include: internalJs,
            use: utils.makeJsLoaders({ target: 'browser', lang: 'ts' }),
          },
          {
            test: /(?!\.css)\.js$/,
            include: internalJs,
            use: utils.makeJsLoaders({ target: 'browser' }),
          },
          ...(isDevServer
            ? []
            : [
                {
                  test: /(?!\.css)\.js$/,
                  exclude: [
                    internalJs,

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
          {
            test: /\.css\.js$/,
            oneOf: utils.makeCssOneOf({ js: true, hot: isDevServer }),
          },
          { test: /\.less$/, oneOf: utils.makeCssOneOf({ hot: isDevServer }) },
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            use: utils.makeImageLoaders(),
          },
          { test: /\.svg$/, use: utils.makeSvgLoaders() },
        ],
      },
      plugins: [
        ...(htmlRenderPlugin ? [htmlRenderPlugin] : []),
        ...(renderHtml
          ? [
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
        new MiniCssExtractPlugin({
          filename: cssFileMask,
          chunkFilename: cssChunkFileMask,
        }),
        new webpack.HashedModuleIdsPlugin(),
        createTreatPlugin({
          target: 'browser',
          isProductionBuild,
          internalJs,
        }),
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
            packageName => new RegExp(`^(${packageName})`),
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
          {
            test: /(?!\.css)\.(ts|tsx)$/,
            include: internalJs,
            use: utils.makeJsLoaders({ target: 'node', lang: 'ts' }),
          },
          {
            test: /(?!\.css)\.js$/,
            include: internalJs,
            use: utils.makeJsLoaders({ target: 'node' }),
          },
          { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
          {
            test: /\.css\.js$/,
            oneOf: utils.makeCssOneOf({ server: true, js: true }),
          },
          {
            test: /\.less$/,
            oneOf: utils.makeCssOneOf({
              server: true,
            }),
          },
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            use: utils.makeImageLoaders({ server: true }),
          },
          { test: /\.svg$/, use: utils.makeSvgLoaders() },
        ],
      },
      plugins: [
        ...(htmlRenderPlugin ? [htmlRenderPlugin.render()] : []),
        new webpack.DefinePlugin(envVars),
        new webpack.DefinePlugin({
          SKU_LIBRARY_NAME: JSON.stringify(libraryName),
          __SKU_PUBLIC_PATH__: JSON.stringify(paths.publicPath),
        }),
        createTreatPlugin({
          target: 'node',
          isProductionBuild,
          internalJs,
        }),
      ],
    },
  ].map(webpackDecorator);

  debug(JSON.stringify(webpackConfigs));

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
