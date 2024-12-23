import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import nodeExternals from 'webpack-node-externals';
import findUp from 'find-up';
import LoadablePlugin from '@loadable/webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import SkuWebpackPlugin from './plugins/sku-webpack-plugin/index.js';
import MetricsPlugin from './plugins/metrics-plugin/index.js';
import { VocabWebpackPlugin } from '@vocab/webpack';

import { bundleAnalyzerPlugin } from './plugins/bundleAnalyzer.js';
import { JAVASCRIPT, resolvePackage } from './utils/index.js';
import { cwd } from '../../lib/cwd.js';
import {
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
} from '../../context/index.js';
import { getVocabConfig } from '../vocab/vocab.js';
import getStatsConfig from './statsConfig.js';
import getSourceMapSetting from './sourceMaps.js';
import getCacheSettings from './cache.js';
import modules from './resolveModules.js';
import targets from '../targets.json' with { type: 'json' };
import type { MakeWebpackConfigOptions } from './types.js';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

const makeWebpackConfig = ({
  clientPort,
  serverPort,
  isDevServer = false,
  hot = false,
  isStartScript = false,
  stats,
}: MakeWebpackConfigOptions) => {
  const isProductionBuild = process.env.NODE_ENV === 'production';
  const webpackMode = isProductionBuild ? 'production' : 'development';

  const vocabOptions = getVocabConfig();

  const internalInclude = [join(__dirname, '../../entry'), ...paths.src];

  const resolvedPolyfills = polyfills.map((polyfill) =>
    require.resolve(polyfill, { paths: [cwd()] }),
  );
  const proto = httpsDevServer ? 'https' : 'http';
  const clientServer = `${proto}://127.0.0.1:${clientPort}/`;

  // Add polyfills to all entries
  const clientEntry = [...resolvedPolyfills, paths.clientEntry];

  const serverEntry = require.resolve('../../entry/server/index.js');

  const publicPath = isDevServer ? clientServer : paths.publicPath;

  const webpackStatsFilename = 'webpackStats.json';

  // The file mask is set to just name in start/dev mode as contenthash
  // is not supported for hot reloading. It can also cause
  // non-deterministic snapshots in jest tests.
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

                      return `${resolvedPackage}${sep}`;
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
        // @ts-expect-error
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
      stats: getStatsConfig({
        stats,
        isStartScript,
      }),
      infrastructureLogging: {
        level: 'error',
      },
    },
    {
      name: 'server',
      mode: webpackMode,
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
      plugins: (
        [
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
        ] as webpack.WebpackPluginInstance[]
      ).concat(
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

export default makeWebpackConfig;
