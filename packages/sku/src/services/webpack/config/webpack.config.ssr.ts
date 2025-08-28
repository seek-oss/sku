import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import webpack, { type Configuration } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import nodeExternals from 'webpack-node-externals';
import { findUpSync } from 'find-up';
import LoadablePlugin from '@loadable/webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import SkuWebpackPlugin from './plugins/sku-webpack-plugin/index.js';
import MetricsPlugin from './plugins/metrics-plugin/index.js';
import { VocabWebpackPlugin } from '@vocab/webpack';

import { bundleAnalyzerPlugin } from './plugins/bundleAnalyzer.js';
import { JAVASCRIPT, resolvePackage } from './utils/index.js';
import { requireFromCwd } from '../../../utils/cwd.js';
import { getVocabConfig } from '../../vocab/config.js';
import getStatsConfig from './statsConfig.js';
import getSourceMapSetting from './sourceMaps.js';
import getCacheSettings from './cache.js';
import modules from './resolveModules.js';
import targets from '../../../config/targets.json' with { type: 'json' };
import type { MakeWebpackConfigOptions } from './types.js';
import { resolvePolyfills } from '../../../utils/resolvePolyfills.js';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

const makeWebpackConfig = ({
  clientPort,
  serverPort,
  isDevServer = false,
  hot = false,
  isStartScript = false,
  stats,
  skuContext,
}: MakeWebpackConfigOptions): Configuration[] => {
  const {
    paths,
    webpackDecorator,
    polyfills,
    supportedBrowsers,
    devServerAsProxy,
    displayNamesProd,
    cspEnabled,
    cspExtraScriptSrcHosts,
    httpsDevServer,
    useDevServerMiddleware,
    rootResolution,
    skipPackageCompatibilityCompilation,
    externalizeNodeModules,
    sourceMapsProd,
  } = skuContext;
  const isProductionBuild = process.env.NODE_ENV === 'production';
  const webpackMode = isProductionBuild ? 'production' : 'development';

  const vocabOptions = getVocabConfig(skuContext);

  const internalInclude = [join(__dirname, '../entry'), ...paths.src];

  const resolvedPolyfills = resolvePolyfills(polyfills);
  const proto = httpsDevServer ? 'https' : 'http';
  const clientServer = `${proto}://127.0.0.1:${clientPort}/`;

  // Add polyfills to all entries
  const clientEntry = [...resolvedPolyfills, paths.clientEntry];

  const serverEntry = require.resolve('../entry/server/index.js');

  const prodPath = isStartScript ? '/' : paths.publicPath;
  const publicPath = devServerAsProxy || !isDevServer ? prodPath : clientServer;

  const webpackStatsFilename = 'webpackStats.json';

  // The file mask is set to just name in start/dev mode as contenthash
  // is not supported for hot reloading. It can also cause
  // non-deterministic snapshots in jest tests.
  const fileMask = isDevServer ? '[name]' : '[name]-[contenthash]';

  const { type } = requireFromCwd('./package.json');

  return [
    {
      name: 'client',
      mode: webpackMode,
      target: `browserslist:${supportedBrowsers}`,
      entry: clientEntry,
      devtool: getSourceMapSetting({ isDevServer, sourceMapsProd }),
      output: {
        path: paths.target,
        publicPath,
        filename: `${fileMask}.js`,
        chunkFilename: `${fileMask}.js`,
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
        ...(hot ? [new ReactRefreshWebpackPlugin()] : []),
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
              modulesDir: findUpSync('node_modules'), // Allow usage within project subdirectories (required for tests)
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
        filename: `server.${type === 'module' ? 'c' : ''}js`,
        hotUpdateChunkFilename: `[id].[fullhash].hot-update.${type === 'module' ? 'c' : ''}js`,
        library: { name: 'server', type: 'var' },
      },
      cache: getCacheSettings({ isDevServer, paths }),
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
};

export default makeWebpackConfig;
