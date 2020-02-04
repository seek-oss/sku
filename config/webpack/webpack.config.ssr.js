const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const lodash = require('lodash');
const nodeExternals = require('webpack-node-externals');
const findUp = require('find-up');
const StartServerPlugin = require('start-server-webpack-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin');
const SkuWebpackPlugin = require('./plugins/SkuWebpackPlugin');

const debug = require('debug')('sku:webpack:config');
const args = require('../args');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const utils = require('./utils');
const { cwd } = require('../../lib/cwd');
const isTypeScript = require('../../lib/isTypeScript');
const {
  paths,
  env,
  webpackDecorator,
  polyfills,
  sourceMapsProd,
  supportedBrowsers,
} = require('../../context');

const makeWebpackConfig = ({ clientPort, serverPort, isDevServer = false }) => {
  const isProductionBuild = process.env.NODE_ENV === 'production';
  const webpackMode = isProductionBuild ? 'production' : 'development';

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
    .mapKeys((value, key) => `process.env.${key}`)
    .value();

  const internalInclude = [path.join(__dirname, '../../entry'), ...paths.src];

  const resolvedPolyfills = polyfills.map(polyfill => {
    return require.resolve(polyfill, { paths: [cwd()] });
  });

  const clientServer = `http://localhost:${clientPort}/`;

  const clientDevServerEntries = [
    `${require.resolve('react-hot-loader/patch')}`,
    `${require.resolve('webpack-dev-server/client')}?${clientServer}`,
    `${require.resolve('webpack/hot/only-dev-server')}`,
  ];

  // Add polyfills and dev server client to all entries
  const clientEntry = isDevServer
    ? [...resolvedPolyfills, ...clientDevServerEntries, paths.clientEntry]
    : [...resolvedPolyfills, paths.clientEntry];

  const serverDevServerEntries = [
    `${require.resolve('webpack/hot/poll')}?1000`,
  ];

  const skuServerEntry = require.resolve('../../entry/server/index.js');

  const serverEntry = isDevServer
    ? [...serverDevServerEntries, skuServerEntry]
    : [skuServerEntry];

  const publicPath = isDevServer ? clientServer : paths.publicPath;

  const sourceMapStyle = isDevServer ? 'inline-source-map' : 'source-map';
  const useSourceMaps = isDevServer || sourceMapsProd;

  const webpackStatsFilename = 'webpackStats.json';

  // The file mask is set to just name in start/dev mode as contenthash
  // is not supported for hot reloading. It can also cause non
  // deterministic snapshots in jest tests.
  const fileMask = isDevServer ? '[name]' : '[name]-[contenthash]';

  const webpackConfigs = [
    {
      name: 'client',
      mode: webpackMode,
      entry: clientEntry,
      devtool: useSourceMaps ? sourceMapStyle : false,
      output: {
        path: paths.target,
        publicPath,
        filename: `${fileMask}.js`,
        chunkFilename: `${fileMask}.js`,
      },
      optimization: {
        nodeEnv: process.env.NODE_ENV,
        minimize: isProductionBuild,
        concatenateModules: isProductionBuild,
        splitChunks: {
          chunks: 'all',
        },
        runtimeChunk: {
          name: 'runtime',
        },
      },
      resolve: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
      },
      module: {
        rules: [
          ...(isDevServer
            ? []
            : [
                {
                  test: utils.JAVASCRIPT,
                  exclude: [
                    internalInclude,
                    ...paths.compilePackages.map(utils.resolvePackage),

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
                            {
                              modules: false,
                              targets: supportedBrowsers,
                            },
                          ],
                        ],
                      },
                    },
                  ],
                },
              ]),
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin(envVars),
        new LoadablePlugin({
          filename: webpackStatsFilename,
          writeToDisk: true,
          outputAsset: false,
        }),
        new MiniCssExtractPlugin({
          filename: `${fileMask}.css`,
          chunkFilename: `${fileMask}.css`,
        }),
        new SkuWebpackPlugin({
          target: 'browser',
          hot: isDevServer,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          generateLessTypes: isTypeScript,
          supportedBrowsers,
          mode: webpackMode,
          MiniCssExtractPlugin,
        }),
      ].concat(
        isDevServer
          ? [
              new webpack.NamedModulesPlugin(),
              new webpack.HotModuleReplacementPlugin(),
              new webpack.NoEmitOnErrorsPlugin(),
            ]
          : [
              bundleAnalyzerPlugin({ name: 'client' }),
              new webpack.HashedModuleIdsPlugin(),
            ],
      ),
    },
    {
      name: 'server',
      mode: webpackMode,
      entry: serverEntry,
      watch: isDevServer,
      externals: [
        nodeExternals({
          modulesDir: findUp.sync('node_modules'), // Allow usage within project subdirectories (required for tests)
          whitelist: [
            'webpack/hot/poll?1000',
            // webpack-node-externals compares the `import` or `require` expression to this list,
            // not the package name, so we map each packageName to a pattern. This ensures it
            // matches when importing a file within a package e.g. import { Text } from 'seek-style-guide/react'.
            ...paths.compilePackages.map(
              packageName => new RegExp(`^(${packageName})`),
            ),
          ],
        }),
      ],
      resolve: {
        alias: {
          __sku_alias__serverEntry: paths.serverEntry,
          __sku_alias__webpackStats: path.join(
            paths.target,
            webpackStatsFilename,
          ),
        },
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
      },
      target: 'node',
      node: {
        __dirname: false,
      },
      output: {
        path: paths.target,
        publicPath,
        filename: 'server.js',
        libraryTarget: 'var',
      },
      optimization: {
        nodeEnv: process.env.NODE_ENV,
      },
      module: {
        rules: [
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin(envVars),
        new webpack.DefinePlugin({
          __SKU_DEFAULT_SERVER_PORT__: JSON.stringify(serverPort),
          __SKU_PUBLIC_PATH__: JSON.stringify(publicPath),
        }),
        new SkuWebpackPlugin({
          target: 'node',
          hot: isDevServer,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          supportedBrowsers,
          mode: webpackMode,
          MiniCssExtractPlugin,
        }),
      ].concat(
        isDevServer
          ? [
              new StartServerPlugin({
                name: 'server.js',
                signal: false,
              }),
              new webpack.NamedModulesPlugin(),
              new webpack.HotModuleReplacementPlugin(),
              new webpack.NoEmitOnErrorsPlugin(),
            ]
          : [],
      ),
    },
  ].map(webpackDecorator);

  debug(JSON.stringify(webpackConfigs));

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
