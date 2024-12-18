const path = require('node:path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const findUp = require('find-up');
const LoadablePlugin = require('@loadable/webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const SkuWebpackPlugin = require('./plugins/sku-webpack-plugin');
const MetricsPlugin = require('./plugins/metrics-plugin');
const { VocabWebpackPlugin } = require('@vocab/webpack');

const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const utils = require('./utils');
const { cwd } = require('../../lib/cwd');
const {
  paths,
  webpackDecorator,
  polyfills,
  supportedBrowsers,
  displayNamesProd,
  cspEnabled,
  cspExtraScriptSrcHosts,
  httpsDevServer,
  useDevServerMiddleware,
  rootResolution,
  skipPackageCompatibilityCompilation,
  externalizeNodeModules,
} = require('../../context');
const { getVocabConfig } = require('../vocab/vocab');
const statsConfig = require('./statsConfig');
const getSourceMapSetting = require('./sourceMaps');
const getCacheSettings = require('./cache');
const modules = require('./resolveModules');
const targets = require('../targets.json');

const makeWebpackConfig = ({
  clientPort,
  serverPort,
  isDevServer = false,
  hot = false,
}) => {
  const isProductionBuild = process.env.NODE_ENV === 'production';
  const webpackMode = isProductionBuild ? 'production' : 'development';

  const vocabOptions = getVocabConfig();

  const internalInclude = [path.join(__dirname, '../../entry'), ...paths.src];

  const resolvedPolyfills = polyfills.map((polyfill) => {
    return require.resolve(polyfill, { paths: [cwd()] });
  });
  const proto = httpsDevServer ? 'https' : 'http';
  const clientServer = `${proto}://127.0.0.1:${clientPort}/`;

  // Add polyfills to all entries
  const clientEntry = [...resolvedPolyfills, paths.clientEntry];

  const serverEntry = require.resolve('../../entry/server/index.js');

  const publicPath = isDevServer ? clientServer : paths.publicPath;

  const webpackStatsFilename = 'webpackStats.json';

  // The file mask is set to just name in start/dev mode as contenthash
  // is not supported for hot reloading. It can also cause non
  // deterministic snapshots in jest tests.
  const fileMask = isDevServer ? '[name]' : '[name]-[contenthash]';

  const webpackConfigs = [
    {
      name: 'client',
      mode: webpackMode,
      target: `browserslist:${supportedBrowsers}`,
      entry: clientEntry,
      devtool: getSourceMapSetting({ isDevServer }),
      output: {
        path: paths.target,
        publicPath,
        filename: `${fileMask}.js`,
        chunkFilename: `${fileMask}.js`,
      },
      cache: getCacheSettings({ isDevServer }),
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
        splitChunks: {
          chunks: 'all',
        },
        runtimeChunk: {
          name: 'runtime',
        },
        emitOnErrors: isProductionBuild,
      },
      resolve: {
        modules,
      },
      module: {
        rules: [
          ...(isDevServer
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
                        cacheDirectory: true,
                        cacheCompression: false,
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
          { test: /\.mjs$/, type: 'javascript/auto' },
        ],
      },
      plugins: [
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
          hot,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          generateCSSTypes: true,
          browserslist: supportedBrowsers,
          mode: webpackMode,
          displayNamesProd,
          MiniCssExtractPlugin,
          rootResolution,
          removeAssertionsInProduction: true,
        }),
        ...(isDevServer
          ? [new MetricsPlugin({ type: 'ssr', target: 'browser' })]
          : [bundleAnalyzerPlugin({ name: 'client' })]),
        ...(hot
          ? [
              new ReactRefreshWebpackPlugin({
                overlay: {
                  sockPort: clientPort,
                  sockPath: '/ws',
                },
              }),
            ]
          : []),
        ...(vocabOptions ? [new VocabWebpackPlugin(vocabOptions)] : []),
      ],
      stats: statsConfig,
      infrastructureLogging: {
        level: 'error',
      },
    },
    {
      name: 'server',
      mode: webpackMode,
      target: `browserslist:${targets.browserslistNodeTarget}`,
      entry: serverEntry,
      externals: [
        {
          __sku_alias__webpackStats: `commonjs ./${webpackStatsFilename}`,
        },
        // Don't bundle or transpile non-compiled packages if externalizeNodeModules is enabled
        externalizeNodeModules
          ? nodeExternals({
              modulesDir: findUp.sync('node_modules'), // Allow usage within project subdirectories (required for tests)
              allowlist: [
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
      resolve: {
        alias: {
          __sku_alias__serverEntry: paths.serverEntry,
        },
        modules,
      },
      target: 'node',
      node: {
        __dirname: false,
      },
      output: {
        path: paths.target,
        publicPath,
        filename: 'server.js',
        library: { name: 'server', type: 'var' },
      },
      cache: getCacheSettings({ isDevServer }),
      optimization: {
        nodeEnv: process.env.NODE_ENV,
        emitOnErrors: isProductionBuild,
        minimize: false,
        concatenateModules: false,
      },
      module: {
        rules: [{ test: /\.mjs$/, type: 'javascript/auto' }],
      },
      plugins: [
        new webpack.DefinePlugin({
          __SKU_DEFAULT_SERVER_PORT__: JSON.stringify(serverPort),
          __SKU_PUBLIC_PATH__: JSON.stringify(publicPath),
          __SKU_CSP__: JSON.stringify({
            enabled: cspEnabled,
            extraHosts: cspExtraScriptSrcHosts,
          }),
          __SKU_DEV_MIDDLEWARE_PATH__: JSON.stringify(
            isDevServer ? paths.devServerMiddleware : false,
          ),
          __SKU_DEV_MIDDLEWARE_ENABLED__: JSON.stringify(
            isDevServer ? useDevServerMiddleware : false,
          ),
          __SKU_DEV_HTTPS__: JSON.stringify(
            isDevServer ? httpsDevServer : false,
          ),
        }),
        new SkuWebpackPlugin({
          target: 'node',
          hot: isDevServer,
          include: internalInclude,
          compilePackages: paths.compilePackages,
          browserslist: [targets.browserslistNodeTarget],
          mode: webpackMode,
          displayNamesProd,
          MiniCssExtractPlugin,
          rootResolution,
        }),
      ].concat(
        isDevServer
          ? [
              new webpack.HotModuleReplacementPlugin(),
              new MetricsPlugin({ type: 'ssr', target: 'node' }),
            ]
          : [],
      ),
    },
  ].map(webpackDecorator);

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
