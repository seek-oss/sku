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
const bundleAnalyzerPlugin = require('./plugins/bundleAnalyzer');
const utils = require('./utils');

const webpackMode = utils.isProductionBuild ? 'production' : 'development';

const buildWebpackConfigs = builds.map(
  ({ name, paths, env, locales, webpackDecorator, port, polyfills }) => {
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

    const isStartScript = args.script === 'start-ssr';

    const resolvedPolyfills = polyfills.map(polyfill => {
      return require.resolve(polyfill, { paths: [process.cwd()] });
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

    return [
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
        module: {
          rules: [
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
                    presets: [require.resolve('babel-preset-env')]
                  }
                }
              ]
            },
            {
              test: /\.css\.js$/,
              use: isStartScript
                ? utils.makeCssLoaders({ js: true })
                : [MiniCssExtractPlugin.loader].concat(
                    utils.makeCssLoaders({ js: true })
                  )
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
                  use: isStartScript
                    ? utils.makeCssLoaders({ packageName })
                    : [MiniCssExtractPlugin.loader].concat(
                        utils.makeCssLoaders({ packageName })
                      )
                })),
                {
                  exclude: /node_modules/,
                  use: isStartScript
                    ? utils.makeCssLoaders()
                    : [MiniCssExtractPlugin.loader].concat(
                        utils.makeCssLoaders()
                      )
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
        plugins: [new webpack.DefinePlugin(envVars)].concat(
          isStartScript
            ? [
                new webpack.NamedModulesPlugin(),
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoEmitOnErrorsPlugin()
              ]
            : [
                bundleAnalyzerPlugin({ name: 'client' }),
                new MiniCssExtractPlugin({
                  filename: 'style.css'
                })
              ]
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
              /.-style-guide/,
              ...paths.compilePackages
            ]
          })
        ],
        resolve: {
          alias: {
            __sku_alias__serverEntry: paths.serverEntry
          }
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
            : [bundleAnalyzerPlugin({ name: 'server' })]
        )
      }
    ].map(webpackDecorator);
  }
);

module.exports = flatten(buildWebpackConfigs);
