const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nodeExternals = require('webpack-node-externals');
const lodash = require('lodash');
const path = require('path');

const args = require('../args');
const config = require('../../context');
const createHtmlRenderPlugin = require('./plugins/createHtmlRenderPlugin');
const { bundleAnalyzerPlugin } = require('./plugins/bundleAnalyzer');
const utils = require('./utils');
const debug = require('debug')('sku:webpack:config');
const { cwd } = require('../../lib/cwd');

const startRenderEntry = require.resolve('../../entry/render/startRenderEntry');
const buildRenderEntry = require.resolve('../../entry/render/buildRenderEntry');

const {
  paths,
  env,
  webpackDecorator,
  polyfills,
  isLibrary,
  libraryName,
  isStartScript,
  supportedBrowsers
} = config;

// port is only required for dev builds
const makeWebpackConfig = ({ isStorybook = false, port = 0 } = {}) => {
  const webpackMode = utils.isProductionBuild ? 'production' : 'development';

  const renderHtml = isLibrary ? isStartScript : !isStorybook;
  const htmlRenderPlugin = renderHtml ? createHtmlRenderPlugin() : null;

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
    .set('PORT', JSON.stringify(port))
    .mapKeys((value, key) => `process.env.${key}`)
    .value();

  const resolvedPolyfills = polyfills.map(polyfill => {
    return require.resolve(polyfill, { paths: [cwd()] });
  });

  const devServerEntries = [
    `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}/`
  ];

  const createEntry = entry => [
    ...resolvedPolyfills,
    ...(isStartScript ? devServerEntries : []),
    entry
  ];

  // Add polyfills and dev server client to all entries
  const clientEntry = isLibrary
    ? createEntry(paths.libraryEntry)
    : createEntry(paths.clientEntry);

  const internalJs = [
    path.join(__dirname, '../../entry'),
    ...paths.src,
    ...paths.compilePackages.map(utils.resolvePackage)
  ];

  // The client file mask is set to just name in start/dev mode as contenthash
  // is not supported for hot reloading. It can also cause non
  // deterministic snapshots in jest tests.
  const clientFileMask = isStartScript ? '[name]' : '[name]-[contenthash]';

  // Libraries should always have the same file name
  const libraryFileMask = libraryName;

  const jsFileMask = isLibrary
    ? `${libraryFileMask}.js`
    : `${clientFileMask}.js`;
  const cssFileMask = isLibrary
    ? `${libraryFileMask}.css`
    : `${clientFileMask}.css`;

  const webpackConfigs = [
    {
      name: 'client',
      mode: webpackMode,
      entry: clientEntry,
      devtool: isStartScript ? 'inline-source-map' : false,
      output: {
        path: paths.target,
        publicPath: paths.publicPath,
        filename: jsFileMask,
        chunkFilename: jsFileMask,
        ...(isLibrary
          ? {
              library: libraryName,
              libraryTarget: 'umd',
              libraryExport: 'default'
            }
          : {})
      },
      optimization: {
        nodeEnv: process.env.NODE_ENV,
        minimize: utils.isProductionBuild,
        concatenateModules: utils.isProductionBuild,
        ...(!isLibrary
          ? {
              splitChunks: {
                chunks: 'all'
              },
              runtimeChunk: {
                name: 'runtime'
              }
            }
          : {})
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
                    [
                      require.resolve('@babel/preset-env'),
                      {
                        modules: false,
                        targets: supportedBrowsers
                      }
                    ]
                  ]
                }
              }
            ]
          },
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto'
          },
          {
            test: /\.css\.js$/,
            oneOf: utils.makeCssOneOf({ js: true })
          },
          {
            test: /\.less$/,
            oneOf: utils.makeCssOneOf()
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
        ...(htmlRenderPlugin ? [htmlRenderPlugin] : []),
        ...(isStartScript ? [] : [bundleAnalyzerPlugin({ name: 'client' })]),
        new webpack.DefinePlugin(envVars),
        new MiniCssExtractPlugin({
          filename: cssFileMask,
          chunkFilename: cssFileMask
        }),
        new webpack.HashedModuleIdsPlugin()
      ]
    },
    {
      name: 'render',
      mode: 'development',
      entry: {
        main: isStartScript ? startRenderEntry : buildRenderEntry
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
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto'
          },
          {
            test: /\.css\.js$/,
            oneOf: utils.makeCssOneOf({ server: true, js: true })
          },
          {
            test: /\.less$/,
            oneOf: utils.makeCssOneOf({ server: true })
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
        ...(htmlRenderPlugin ? [htmlRenderPlugin.render()] : []),
        new webpack.DefinePlugin(envVars),
        new webpack.DefinePlugin({
          SKU_LIBRARY_NAME: JSON.stringify(libraryName)
        })
      ]
    }
  ].map(webpackDecorator);

  debug(JSON.stringify(webpackConfigs));

  return webpackConfigs;
};

module.exports = makeWebpackConfig;
