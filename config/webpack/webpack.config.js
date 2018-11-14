const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');

const args = require('../args');
const config = require('../../context');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const staticRenderPlugin = require('./plugins/staticSitePlugin');
const utils = require('./utils');
const debug = require('debug')('sku:webpack');
const { cwd } = require('../../lib/cwd');

const startRenderEntry = require.resolve('../render/startRenderEntry');
const buildRenderEntry = require.resolve('../render/buildRenderEntry');

const webpackMode = utils.isProductionBuild ? 'production' : 'development';

const { paths, env, webpackDecorator, port, polyfills, isStartScript } = config;

const envVars = lodash
  .chain(env)
  .mapValues((value, key) => {
    if (typeof value !== 'object') {
      return JSON.stringify(value);
    }

    const valueForEnv = value[args.env];

    if (typeof valueForEnv === 'undefined') {
      console.log(
        `WARNING: Environment variable "${key}" is missing a value for the "${
          args.env
        }" environment`
      );
      process.exit(1);
    }

    return JSON.stringify(valueForEnv);
  })
  .set('SKU_ENV', JSON.stringify(args.env))
  .set('PORT', JSON.stringify(port.client))
  .mapKeys((value, key) => `process.env.${key}`)
  .value();

const resolvedPolyfills = polyfills.map(polyfill => {
  return require.resolve(polyfill, { paths: [cwd()] });
});

const devServerEntries = [
  `${require.resolve('webpack-dev-server/client')}?http://localhost:${
    port.client
  }/`
];

// Add polyfills and dev server client to all entries
const entries = lodash.mapValues(
  paths.clientEntries,
  entry =>
    isStartScript
      ? [...resolvedPolyfills, ...devServerEntries, entry]
      : [...resolvedPolyfills, entry]
);

const internalJs = [
  ...paths.src,
  ...paths.compilePackages.map(utils.resolvePackage)
];

debug({ build: 'default', internalJs });

const buildWebpackConfigs = [
  {
    name: 'client',
    mode: webpackMode,
    entry: entries,
    devtool: isStartScript ? 'inline-source-map' : false,
    output: {
      path: paths.target,
      publicPath: paths.publicPath,
      filename: '[name]-[contenthash].js',
      chunkFilename: '[name]-[contenthash].js'
    },
    optimization: {
      nodeEnv: process.env.NODE_ENV,
      minimize: utils.isProductionBuild,
      concatenateModules: utils.isProductionBuild,
      splitChunks: {
        chunks: 'all'
      },
      runtimeChunk: {
        name: 'runtime'
      }
    },
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts', '.tsx']
    },
    module: {
      rules: [
        {
          test: /(?!\.css)\.(ts|tsx)$/,
          include: internalJs,
          use: utils.makeJsLoaders({ target: 'browser', lang: 'ts' })
        },
        {
          test: /(?!\.css)\.js$/,
          include: internalJs,
          use: utils.makeJsLoaders({ target: 'browser' })
        },
        {
          test: /(?!\.css)\.js$/,
          exclude: internalJs,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                presets: [
                  [require.resolve('@babel/preset-env'), { modules: false }]
                ]
              }
            }
          ]
        },
        {
          test: /\.css\.js$/,
          use: utils.makeCssLoaders({ js: true })
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        },
        {
          test: /\.less$/,
          oneOf: [
            ...paths.compilePackages.map(packageName => ({
              include: utils.resolvePackage(packageName),
              use: utils.makeCssLoaders({ packageName })
            })),
            {
              exclude: /node_modules/,
              use: utils.makeCssLoaders()
            }
          ]
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          use: utils.makeImageLoaders()
        },
        {
          test: /\.svg$/,
          use: utils.makeSvgLoaders()
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin(envVars),
      ...(isStartScript ? [] : [bundleAnalyzerPlugin({ name: 'client' })]),
      new MiniCssExtractPlugin({
        filename: '[name]-[contenthash].css',
        chunkFilename: '[name]-[contenthash].css'
      }),
      new webpack.HashedModuleIdsPlugin()
    ]
  },
  {
    name: 'render',
    mode: 'development',
    entry: {
      render: isStartScript ? startRenderEntry : buildRenderEntry
    },
    target: 'node',
    externals: [
      // Don't bundle or transpile non-compiled packages
      nodeExternals({
        // webpack-node-externals compares the `import` or `require` expression to this list,
        // not the package name, so we map each packageName to a pattern. This ensures it
        // matches when importing a file within a package e.g. import { Text } from 'seek-style-guide/react'.
        whitelist: paths.compilePackages.map(
          packageName => new RegExp(`^(${packageName})`)
        )
      })
    ],
    output: {
      path: paths.target,
      publicPath: paths.publicPath,
      filename: 'render.js',
      libraryExport: 'default',
      library: 'static',
      libraryTarget: 'umd2'
    },
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
      alias: {
        __sku_alias__renderEntry: paths.renderEntry
      }
    },
    module: {
      rules: [
        {
          test: /(?!\.css)\.(ts|tsx)$/,
          include: internalJs,
          use: utils.makeJsLoaders({ target: 'node', lang: 'ts' })
        },
        {
          test: /(?!\.css)\.js$/,
          include: internalJs,
          use: utils.makeJsLoaders({ target: 'node' })
        },
        {
          test: /\.css\.js$/,
          use: utils.makeCssLoaders({ server: true, js: true })
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        },
        {
          test: /\.less$/,
          oneOf: [
            ...paths.compilePackages.map(packageName => ({
              include: utils.resolvePackage(packageName),
              use: utils.makeCssLoaders({ server: true, packageName })
            })),
            {
              exclude: /node_modules/,
              use: utils.makeCssLoaders({ server: true })
            }
          ]
        },

        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          use: utils.makeImageLoaders({ server: true })
        },
        {
          test: /\.svg$/,
          use: utils.makeSvgLoaders()
        }
      ]
    },
    plugins: [new webpack.DefinePlugin(envVars)]
  }
].map(webpackDecorator);

debug(JSON.stringify(buildWebpackConfigs));

const compiler = webpack(buildWebpackConfigs);
compiler.apply(staticRenderPlugin());

module.exports = compiler;
