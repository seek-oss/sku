const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const builds = require('../builds.ssr');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const findUp = require('find-up');
const StartServerPlugin = require('start-server-webpack-plugin');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const utils = require('./utils');
const debug = require('debug')('sku:webpack');
const { cwd } = require('../../lib/cwd');

const webpackMode = utils.isProductionBuild ? 'production' : 'development';

const buildWebpackConfigs = builds.map(
  ({ name, paths, env, webpackDecorator, port, polyfills }) => {
    const envVars = lodash
      .chain(env)
      .mapValues((value, key) => {
        if (typeof value !== 'object') {
          return JSON.stringify(value);
        }

        const valueForEnv = value[args.env];

        if (typeof valueForEnv === 'undefined') {
          console.log(
            `WARNING: Environment variable "${key}" for build "${name}" is missing a value for the "${
              args.env
            }" environment`
          );
          process.exit(1);
        }

        return JSON.stringify(valueForEnv);
      })
      .set('SKU_ENV', JSON.stringify(args.env))
      .set('SKU_PORT', JSON.stringify(port.backend))
      .mapKeys((value, key) => `process.env.${key}`)
      .value();

    const internalJs = [
      ...paths.src,
      ...paths.compilePackages.map(utils.resolvePackage)
    ];

    debug({ build: name || 'default', internalJs });

    const isStartScript = args.script === 'start-ssr';

    const resolvedPolyfills = polyfills.map(polyfill => {
      return require.resolve(polyfill, { paths: [cwd()] });
    });

    // Define clientEntry
    const clientDevServerEntries = [
      'react-hot-loader/patch',
      `${require.resolve('webpack-dev-server/client')}?http://localhost:${
        port.client
      }/`,
      `${require.resolve('webpack/hot/only-dev-server')}`
    ];

    const clientEntry = isStartScript
      ? [...resolvedPolyfills, ...clientDevServerEntries, paths.clientEntry]
      : [...resolvedPolyfills, paths.clientEntry];

    // Define serverEntry
    const renderEntry =
      paths.renderEntry || path.join(__dirname, '../server/index.js');

    const serverDevServerEntries = [
      `${require.resolve('webpack/hot/poll')}?1000`
    ];

    const serverEntry = isStartScript
      ? [...serverDevServerEntries, renderEntry]
      : [renderEntry];

    // Define publicPath
    const publicPath = isStartScript
      ? `http://localhost:${port.client}/`
      : paths.publicPath || '';

    const result = [
      {
        name: 'client',
        mode: webpackMode,
        entry: clientEntry,
        devtool: isStartScript ? 'inline-source-map' : false,
        output: {
          path: paths.dist,
          filename: '[name].js',
          publicPath
        },
        optimization: {
          nodeEnv: process.env.NODE_ENV,
          minimize: utils.isProductionBuild,
          concatenateModules: utils.isProductionBuild
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
                    presets: [require.resolve('@babel/preset-env')]
                  }
                }
              ]
            },
            {
              test: /\.css\.js$/,
              use: utils.makeCssLoaders({
                js: true,
                hot: isStartScript
              })
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
                  use: utils.makeCssLoaders({
                    packageName,
                    hot: isStartScript
                  })
                })),
                {
                  exclude: /node_modules/,
                  use: utils.makeCssLoaders({
                    hot: isStartScript
                  })
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
          new MiniCssExtractPlugin({
            filename: 'style.css'
          })
        ].concat(
          isStartScript
            ? [
                new webpack.NamedModulesPlugin(),
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoEmitOnErrorsPlugin()
              ]
            : [bundleAnalyzerPlugin({ name: 'client' })]
        )
      },
      {
        name: 'server',
        mode: webpackMode,
        entry: serverEntry,
        watch: isStartScript,
        externals: [
          nodeExternals({
            modulesDir: findUp.sync('node_modules'), // Allow usage within project subdirectories (required for tests)
            whitelist: [
              'webpack/hot/poll?1000',
              // webpack-node-externals compares the `import` or `require` expression to this list,
              // not the package name, so we map each packageName to a pattern. This ensures it
              // matches when importing a file within a package e.g. import { Text } from 'seek-style-guide/react'.
              ...paths.compilePackages.map(
                packageName => new RegExp(`^(${packageName})`)
              )
            ]
          })
        ],
        resolve: {
          alias: {
            __sku_alias__serverEntry: paths.serverEntry
          },
          extensions: ['.mjs', '.js', '.json', '.ts', '.tsx']
        },
        target: 'node',
        node: {
          __dirname: false
        },
        output: {
          path: paths.dist,
          filename: 'server.js',
          libraryTarget: 'var'
        },
        optimization: {
          nodeEnv: process.env.NODE_ENV
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
        plugins: [
          new webpack.DefinePlugin(envVars),
          new webpack.DefinePlugin({
            __SKU_PUBLIC_PATH__: JSON.stringify(publicPath)
          })
        ].concat(
          isStartScript
            ? [
                new StartServerPlugin({
                  name: 'server.js',
                  signal: false
                }),
                new webpack.NamedModulesPlugin(),
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoEmitOnErrorsPlugin()
              ]
            : []
        )
      }
    ].map(webpackDecorator);

    debug(JSON.stringify(result));
    return result;
  }
);

module.exports = flatten(buildWebpackConfigs);
