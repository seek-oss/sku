const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');

const args = require('../args');
const config = require('../../context');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const utils = require('./utils');
const debug = require('debug')('sku:webpack');
const { cwd } = require('../../lib/cwd');

const webpackMode = utils.isProductionBuild ? 'production' : 'development';

const {
  paths,
  env,
  locales,
  webpackDecorator,
  port,
  polyfills,
  isStartScript
} = config;

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

const entry = isStartScript
  ? [...resolvedPolyfills, ...devServerEntries, paths.clientEntry]
  : [...resolvedPolyfills, paths.clientEntry];

const internalJs = [
  ...paths.src,
  ...paths.compilePackages.map(utils.resolvePackage)
];

debug({ build: 'default', internalJs });

const buildWebpackConfigs = [
  {
    name: 'client',
    mode: webpackMode,
    entry,
    output: {
      path: paths.target,
      publicPath: paths.publicPath,
      filename: '[name].js'
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
        filename: 'style.css',
        chunkFilename: '[name].css'
      })
    ]
  },
  {
    name: 'render',
    mode: 'development',
    entry: {
      render: paths.renderEntry
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
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.mjs', '.js', '.json', '.ts', '.tsx']
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
      ...locales.slice(0, utils.isProductionBuild ? locales.length : 1).map(
        locale =>
          new StaticSiteGeneratorPlugin({
            locals: {
              publicPath: paths.publicPath,
              locale
            },
            paths: `index${
              utils.isProductionBuild && locale ? `-${locale}` : ''
            }.html`
          })
      )
    ]
  }
].map(webpackDecorator);

debug(JSON.stringify(buildWebpackConfigs));

module.exports = buildWebpackConfigs;
